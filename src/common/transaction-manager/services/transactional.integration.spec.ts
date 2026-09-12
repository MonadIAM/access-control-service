import { AccessCacheTopicAction, InvalidationScope } from "@monadiam/shared";
import { describe, expect, it, jest } from "@jest/globals";
import { ChangeSetType } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { TransactionalHelper } from "~testing/integration/transaction-manager/transactional.helpers";
import { ActionType, EntityType, KafkaTopic, RoleActorType, RoleArchetype } from "~context/enums";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { RoleClosure, Realm, Role } from "~context/domain/entities";
import { postgresSuite } from "~testing/integration/postgres.suite";

import { AuditLog, ChangeLog, Outbox } from "../entities";

describe("TransactionalService integration", () => {
    const helper = new TransactionalHelper();
    const suite = postgresSuite({
        repository: ({ orm }) => helper.createTransactionalServiceContext({ orm }),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    const ACCESS_CACHE_OUTBOX_CONFIG = {
        payloadMapper: () => ({ items: [{ scope: InvalidationScope.GLOBAL }] }),
        actionType: AccessCacheTopicAction.INVALIDATE,
        destinationTopic: KafkaTopic.ACCESS_CACHE,
    } satisfies TransactionManager.Service.OutboxConfig<Entities.Role>;

    const AUDIT_PROPS = {
        context: { ip: "127.0.0.1", userAgent: "transactional-integration" },
        actionType: ActionType.CREATE,
        entityType: EntityType.ROLE,
        actor: randomUUID(),
        realm: randomUUID(),
    };

    it("commits audit log, change log, archive outbox and domain outbox in one trace", async () => {
        const realmOwner = randomUUID();
        const roleCode = "trace.role";
        const result = await suite.repository().service.run({
            audit: { ...AUDIT_PROPS, input: { password: "secret-value" } },
            changeLog: true,
            outbox: ACCESS_CACHE_OUTBOX_CONFIG,
            execute: (transaction) => {
                const realm = new Realm({
                    code: "trace.realm",
                    name: "Trace Realm",
                    owner: realmOwner,
                });
                const role = new Role({
                    archetype: RoleArchetype.ATOMIC,
                    actorType: RoleActorType.HUMAN,
                    name: "Trace Role",
                    code: roleCode,
                    realm,
                });

                transaction.persist(realm);
                transaction.persist(role);

                return role;
            },
        });

        const readManager = suite.repository().readManager;
        readManager.clear();
        const auditLogs = await readManager.find(AuditLog, {});
        const changeLogs = await readManager.find(ChangeLog, {}, { orderBy: { entityType: "ASC" } });

        expect(result).toBeInstanceOf(Role);
        expect(await readManager.count(Realm, { owner: realmOwner })).toBe(1);
        expect(await readManager.count(Role, { code: roleCode })).toBe(1);
        expect(auditLogs).toHaveLength(1);
        expect(auditLogs[0]).toEqual(
            expect.objectContaining({
                input: { password: "masked:secret-value" },
                signature: expect.stringContaining("signed:AuditLog:"),
                keyVersion: 7,
            }),
        );
        expect(changeLogs).toHaveLength(2);
        expect(changeLogs.map((change) => change.auditEntry)).toEqual([auditLogs[0]!.id, auditLogs[0]!.id]);
        expect(changeLogs.map((change) => change.changeType)).toEqual([ChangeSetType.CREATE, ChangeSetType.CREATE]);
        await expect(readManager.count(Outbox, { destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE })).resolves.toBe(1);
        await expect(readManager.count(Outbox, { destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE })).resolves.toBe(2);
        await expect(readManager.count(Outbox, { destinationTopic: KafkaTopic.ACCESS_CACHE })).resolves.toBe(1);
    });

    it("commits domain outbox without audit context", async () => {
        const owner = randomUUID();

        await suite.repository().service.run({
            outbox: ACCESS_CACHE_OUTBOX_CONFIG,
            execute: (transaction) => {
                const realm = new Realm({
                    code: "outbox-only.realm",
                    name: "Outbox Only Realm",
                    owner,
                });
                const role = new Role({
                    archetype: RoleArchetype.ATOMIC,
                    actorType: RoleActorType.HUMAN,
                    name: "Outbox Only Role",
                    code: "outbox-only.role",
                    realm,
                });

                transaction.persist(realm);
                transaction.persist(role);

                return role;
            },
        });

        const readManager = suite.repository().readManager;
        readManager.clear();

        await expect(readManager.count(Realm, { owner })).resolves.toBe(1);
        await expect(readManager.count(Role, { code: "outbox-only.role" })).resolves.toBe(1);
        await expect(readManager.count(Outbox, { destinationTopic: KafkaTopic.ACCESS_CACHE })).resolves.toBe(1);
        await expect(readManager.count(AuditLog, {})).resolves.toBe(0);
        await expect(readManager.count(ChangeLog, {})).resolves.toBe(0);
    });

    it("emits audit log, audit archive and outbox without change log", async () => {
        await suite.repository().service.emit({
            audit: { ...AUDIT_PROPS, input: { password: "rejected-secret" } },
            payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
            actionType: AccessCacheTopicAction.INVALIDATE,
            destinationTopic: KafkaTopic.ACCESS_CACHE,
        });

        const readManager = suite.repository().readManager;
        readManager.clear();
        const auditLogs = await readManager.find(AuditLog, {});

        expect(auditLogs).toHaveLength(1);
        expect(auditLogs[0]).toEqual(
            expect.objectContaining({
                input: { password: "masked:rejected-secret" },
                signature: expect.stringContaining("signed:AuditLog:"),
                keyVersion: 7,
            }),
        );
        await expect(readManager.count(Outbox, { destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE })).resolves.toBe(1);
        await expect(readManager.count(Outbox, { destinationTopic: KafkaTopic.ACCESS_CACHE })).resolves.toBe(1);
        await expect(readManager.count(ChangeLog, {})).resolves.toBe(0);
    });

    it("rolls back domain rows, audit log, change log and outbox after a flushed domain write fails", async () => {
        const rollbackError = new Error("rollback after flush");

        await expect(
            suite.repository().service.run({
                audit: AUDIT_PROPS,
                changeLog: true,
                outbox: ACCESS_CACHE_OUTBOX_CONFIG,
                execute: async (transaction) => {
                    const realm = new Realm({
                        code: "rollback.realm",
                        name: "Rollback Realm",
                        owner: randomUUID(),
                    });
                    const role = new Role({
                        archetype: RoleArchetype.ATOMIC,
                        actorType: RoleActorType.HUMAN,
                        name: "Rollback Role",
                        code: "rollback.role",
                        realm,
                    });

                    transaction.persist(realm);
                    transaction.persist(role);
                    await transaction.flush();

                    throw rollbackError;
                },
            }),
        ).rejects.toBe(rollbackError);

        await helper.expectNoTransactionRows(suite.repository().readManager);
    });

    it("rolls back audit and domain rows when domain outbox building fails", async () => {
        const externalError = new Error("schema registry unavailable");
        const outboxService = helper.createOutboxService({
            build: () => {
                throw externalError;
            },
        });
        const service = helper.createTransactionalServiceContext({
            logMaskingService: helper.createLogMaskingService(),
            orm: suite.repository().orm,
            outboxService,
        }).service;

        await expect(
            service.run({
                audit: AUDIT_PROPS,
                changeLog: true,
                outbox: ACCESS_CACHE_OUTBOX_CONFIG,
                execute: (transaction) => {
                    const realm = new Realm({
                        code: "outbox-failure.realm",
                        name: "Outbox Failure Realm",
                        owner: randomUUID(),
                    });
                    const role = new Role({
                        archetype: RoleArchetype.ATOMIC,
                        actorType: RoleActorType.HUMAN,
                        name: "Outbox Failure Role",
                        code: "outbox-failure.role",
                        realm,
                    });

                    transaction.persist(realm);
                    transaction.persist(role);

                    return role;
                },
            }),
        ).rejects.toBe(externalError);

        await helper.expectNoTransactionRows(suite.repository().readManager);
    });

    it("does not execute domain code when audit signing fails", async () => {
        const externalError = new Error("vault signing unavailable");
        const execute = jest.fn<(transaction: ORM.EntityManager) => void>();
        const logMaskingService = helper.createLogMaskingService({
            sign: () => Promise.reject(externalError),
        });
        const service = helper.createTransactionalServiceContext({
            orm: suite.repository().orm,
            logMaskingService,
        }).service;

        await expect(
            service.run({
                audit: AUDIT_PROPS,
                changeLog: true,
                execute,
            }),
        ).rejects.toBe(externalError);

        expect(execute).not.toHaveBeenCalled();
        await helper.expectNoTransactionRows(suite.repository().readManager);
    });

    it("persists several real subscriber change logs in one audit transaction", async () => {
        const realm = await suite.fixtures().createRealm({ code: "subscriber.realm" });
        const first = await suite.fixtures().createRole({ realm, code: "subscriber.first", name: "First Role" });
        const second = await suite.fixtures().createRole({ realm, code: "subscriber.second", name: "Second Role" });

        await suite.repository().service.run({
            audit: { ...AUDIT_PROPS, actionType: ActionType.UPDATE },
            changeLog: true,
            execute: async (transaction) => {
                const firstRole = await transaction.findOneOrFail(Role, { id: first.id });
                const secondRole = await transaction.findOneOrFail(Role, { id: second.id });

                firstRole.update({ patch: { name: "First Role Updated" } });
                secondRole.update({ patch: { name: "Second Role Updated" } });
            },
        });

        const readManager = suite.repository().readManager;
        readManager.clear();
        const auditLogs = await readManager.find(AuditLog, {});
        const changeLogs = await readManager.find(ChangeLog, {}, { orderBy: { entity: "ASC" } });

        expect(auditLogs).toHaveLength(1);
        expect(changeLogs).toHaveLength(2);
        expect(changeLogs.map((change) => change.auditEntry)).toEqual([auditLogs[0]!.id, auditLogs[0]!.id]);
        expect(changeLogs.map((change) => change.changeType)).toEqual([ChangeSetType.UPDATE, ChangeSetType.UPDATE]);
        expect(changeLogs.map((change) => change.delta.name)).toEqual(
            expect.arrayContaining([
                { old: "First Role", new: "First Role Updated" },
                { old: "Second Role", new: "Second Role Updated" },
            ]),
        );
    });

    it("commits a composite primary key change without writing an invalid change-log entity id", async () => {
        const realm = await suite.fixtures().createRealm({ code: "closure.realm" });
        const ancestor = await suite.fixtures().createDetachedRole({ realm, code: "closure.ancestor" });
        const descendant = await suite.fixtures().createDetachedRole({ realm, code: "closure.descendant" });
        await suite.fixtures().createRoleClosure({ realm, ancestor, descendant, depth: 1 });

        await suite.repository().service.run({
            audit: { ...AUDIT_PROPS, actionType: ActionType.UPDATE },
            changeLog: true,
            execute: async (transaction) => {
                const closure = await transaction.findOneOrFail(RoleClosure, {
                    descendant: descendant.id,
                    ancestor: ancestor.id,
                    realm: realm.id,
                });

                closure.depth = 2;
            },
        });

        const readManager = suite.repository().readManager;
        readManager.clear();
        const rows = await readManager.execute<{ depth: number }[]>(
            `
                SELECT depth
                FROM access_control.role_closure
                WHERE realm_id = ?
                  AND ancestor_id = ?
                  AND descendant_id = ?
            `,
            [realm.id, ancestor.id, descendant.id],
        );

        expect(rows).toEqual([{ depth: 2 }]);
        await expect(readManager.count(ChangeLog, {})).resolves.toBe(0);
        await expect(readManager.count(Outbox, { destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE })).resolves.toBe(0);
    });

    it("rolls back and preserves external dependency errors raised during flush", async () => {
        const externalError = new Error("vault unavailable");
        const logMaskingService = helper.createLogMaskingService({
            maskChangeLog: () => Promise.reject(externalError),
        });
        const service = helper.createTransactionalServiceContext({
            orm: suite.repository().orm,
            logMaskingService,
        }).service;

        await expect(
            service.run({
                audit: AUDIT_PROPS,
                changeLog: true,
                execute: (transaction) => {
                    const realm = new Realm({
                        name: "External Failure Realm",
                        code: "external.realm",
                        owner: randomUUID(),
                    });
                    const role = new Role({
                        archetype: RoleArchetype.ATOMIC,
                        actorType: RoleActorType.HUMAN,
                        name: "External Failure Role",
                        code: "external.role",
                        realm,
                    });

                    transaction.persist(realm);
                    transaction.persist(role);
                },
            }),
        ).rejects.toBe(externalError);

        await helper.expectNoTransactionRows(suite.repository().readManager);
    });
});
