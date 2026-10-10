import { AccessCacheTopicAction, InvalidationScope } from "@monadiam/shared";
import { describe, expect, it, jest } from "@jest/globals";
import { ChangeSetType } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { RoleClosureRepository } from "~context/infrastructure/repositories/role-closure.repository";
import { TransactionalHelper } from "~testing/integration/transaction-manager/transactional.helpers";
import { ActionType, EntityType, KafkaTopic, RoleActorType, RoleArchetype } from "~context/enums";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { RoleClosure, Realm, Role } from "~context/domain/entities";

import { AuditLog, ChangeLog, Inbox, Outbox } from "../entities";

describe("[CommonService] - Transactional", () => {
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

    const INCOMING_MESSAGE = {
        source: { topic: "account", partition: 0, offset: "42" },
        event: "00000000-0000-4000-8000-000000000001",
        consumerKey: "access-control.account.v1",
    };

    describe("[Method] - consume", () => {
        it("[case] - commits inbox, domain, audit, change log and outbox exactly once", async () => {
            // Arrange
            const owner = randomUUID();
            const executeDuplicate = jest.fn(() => Promise.reject(new Error("duplicate callback must not execute")));
            const first = await suite.repository().service.consume({
                incoming: INCOMING_MESSAGE,
                audit: AUDIT_PROPS,
                changeLog: true,
                outbox: ACCESS_CACHE_OUTBOX_CONFIG,
                execute: (transaction) => {
                    const realm = new Realm({ code: "inbox.realm", name: "Inbox Realm", owner });
                    const role = new Role({
                        archetype: RoleArchetype.ATOMIC,
                        actorType: RoleActorType.HUMAN,
                        name: "Inbox Role",
                        code: "inbox.role",
                        realm,
                    });

                    transaction.persist(realm);
                    transaction.persist(role);
                    return role;
                },
            });

            // Act
            const duplicate = await suite.repository().service.consume({
                incoming: INCOMING_MESSAGE,
                execute: executeDuplicate,
                audit: AUDIT_PROPS,
                changeLog: true,
            });

            const readManager = suite.repository().readManager;
            readManager.clear();
            const result = await readManager.count(Inbox, {});

            const result2 = await readManager.count(Realm, { owner });

            const result3 = await readManager.count(Role, { code: "inbox.role" });

            const result4 = await readManager.count(AuditLog, {});

            const result5 = await readManager.count(ChangeLog, {});

            const result6 = await readManager.count(Outbox, { destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE });

            const result7 = await readManager.count(Outbox, { destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE });

            const result8 = await readManager.count(Outbox, { destinationTopic: KafkaTopic.ACCESS_CACHE });

            // Assert
            expect(first).toEqual({ status: "processed", value: expect.objectContaining({ code: "inbox.role" }) });
            expect(duplicate).toEqual({ status: "duplicate" });
            expect(executeDuplicate).not.toHaveBeenCalled();
            expect(result).toBe(1);
            expect(result2).toBe(1);
            expect(result3).toBe(1);
            expect(result4).toBe(1);
            expect(result5).toBe(2);
            expect(result6).toBe(1);
            expect(result7).toBe(2);
            expect(result8).toBe(1);
        });

        it("[case] - rolls back the inbox claim with failed domain effects and allows redelivery", async () => {
            // Arrange
            const incoming = { ...INCOMING_MESSAGE, event: "00000000-0000-4000-8000-000000000002" };
            const owner = randomUUID();
            const failure = new Error("domain failed");

            // Act
            const result = suite.repository().service.consume({
                incoming,
                execute: (transaction) => {
                    transaction.persist(new Realm({ code: "rollback.realm", name: "Rollback Realm", owner }));
                    throw failure;
                },
            });
            await Promise.allSettled([result]);
            const readManager = suite.repository().readManager;
            readManager.clear();
            const result2 = await readManager.count(Inbox, {});

            const result3 = await readManager.count(Realm, { owner });

            const redelivery = await suite.repository().service.consume({
                incoming,
                execute: (transaction) => {
                    const realm = new Realm({ code: "redelivery.realm", name: "Redelivery Realm", owner });
                    transaction.persist(realm);
                    return realm;
                },
            });
            readManager.clear();
            const result4 = await readManager.count(Inbox, {});

            const result5 = await readManager.count(Realm, { owner });

            // Assert
            await expect(result).rejects.toBe(failure);
            expect(result2).toBe(0);
            expect(result3).toBe(0);
            expect(redelivery).toEqual({
                status: "processed",
                value: expect.objectContaining({ code: "redelivery.realm" }),
            });
            expect(result4).toBe(1);
            expect(result5).toBe(1);
        });

        it("[case] - allows only one concurrent transaction to process the same event", async () => {
            // Arrange
            const incoming = { ...INCOMING_MESSAGE, event: "00000000-0000-4000-8000-000000000003" };
            const executed: string[] = [];

            // Act
            const consume = (suffix: string): TransactionManager.Service.Consume.Result<Entities.Realm> =>
                suite.repository().service.consume({
                    incoming,
                    execute: async (transaction) => {
                        const realm = new Realm({
                            code: `concurrent.${suffix}`,
                            name: `Concurrent ${suffix}`,
                            owner: randomUUID(),
                        });
                        transaction.persist(realm);
                        executed.push(suffix);
                        await Promise.resolve();
                        return realm;
                    },
                });

            const outcomes = await Promise.all([consume("first"), consume("second")]);
            const readManager = suite.repository().readManager;
            readManager.clear();
            const result2 = await readManager.count(Inbox, {});

            const result3 = await readManager.count(Realm, {});

            // Assert
            expect(outcomes.map(({ status }) => status).sort()).toEqual(["duplicate", "processed"]);
            expect(executed).toHaveLength(1);
            expect(result2).toBe(1);
            expect(result3).toBe(1);
        });
    });

    describe("[Method] - run", () => {
        it("[case] - commits audit log, change log, archive outbox and domain outbox in one trace", async () => {
            // Arrange
            const realmOwner = randomUUID();
            const roleCode = "trace.role";

            // Act
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
            const result2 = await readManager.count(Realm, { owner: realmOwner });
            const result3 = await readManager.count(Role, { code: roleCode });
            const result6 = await readManager.count(Outbox, { destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE });

            const result7 = await readManager.count(Outbox, { destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE });

            const result8 = await readManager.count(Outbox, { destinationTopic: KafkaTopic.ACCESS_CACHE });

            // Assert
            expect(result).toBeInstanceOf(Role);
            expect(result2).toBe(1);
            expect(result3).toBe(1);
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
            expect(result6).toBe(1);
            expect(result7).toBe(2);
            expect(result8).toBe(1);
        });

        it("[case] - commits domain outbox without audit context", async () => {
            // Arrange
            const owner = randomUUID();

            // Act
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

            const result = await readManager.count(Realm, { owner });

            const result2 = await readManager.count(Role, { code: "outbox-only.role" });

            const result3 = await readManager.count(Outbox, { destinationTopic: KafkaTopic.ACCESS_CACHE });

            const result4 = await readManager.count(AuditLog, {});

            const result5 = await readManager.count(ChangeLog, {});

            // Assert
            expect(result).toBe(1);
            expect(result2).toBe(1);
            expect(result3).toBe(1);
            expect(result4).toBe(0);
            expect(result5).toBe(0);
        });

        it("[case] - rolls back domain rows, audit log, change log and outbox after a flushed domain write fails", async () => {
            // Arrange
            const rollbackError = new Error("rollback after flush");

            // Act
            const result = suite.repository().service.run({
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
            });

            // Assert
            await expect(result).rejects.toBe(rollbackError);
            await helper.expectNoTransactionRows(suite.repository().readManager);
        });

        it("[case] - rolls back audit and domain rows when domain outbox building fails", async () => {
            // Arrange
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

            // Act
            const result = service.run({
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
            });

            // Assert
            await expect(result).rejects.toBe(externalError);
            await helper.expectNoTransactionRows(suite.repository().readManager);
        });

        it("[case] - does not execute domain code when audit signing fails", async () => {
            // Arrange
            const externalError = new Error("vault signing unavailable");
            const execute = jest.fn<(transaction: ORM.EntityManager) => void>();
            const logMaskingService = helper.createLogMaskingService({
                sign: () => Promise.reject(externalError),
            });
            const service = helper.createTransactionalServiceContext({
                orm: suite.repository().orm,
                logMaskingService,
            }).service;

            // Act
            const result = service.run({
                audit: AUDIT_PROPS,
                changeLog: true,
                execute,
            });

            // Assert
            await expect(result).rejects.toBe(externalError);
            expect(execute).not.toHaveBeenCalled();
            await helper.expectNoTransactionRows(suite.repository().readManager);
        });

        it("[case] - persists several real subscriber change logs in one audit transaction", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "subscriber.realm" });
            const first = await suite.fixtures().createRole({ realm, code: "subscriber.first", name: "First Role" });
            const second = await suite.fixtures().createRole({ realm, code: "subscriber.second", name: "Second Role" });

            // Act
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

            // Assert
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

        it("[case] - commits a composite primary key change with a joined change-log entity id", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "closure.realm" });
            const ancestor = await suite.fixtures().createDetachedRole({ realm, code: "closure.ancestor" });
            const descendant = await suite.fixtures().createDetachedRole({ realm, code: "closure.descendant" });
            await suite.fixtures().createRoleClosure({ realm, ancestor, descendant, depth: 1 });

            // Act
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

            const [changeLog] = await readManager.find(ChangeLog, {});
            const result = await readManager.count(Outbox, { destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE });

            // Assert
            expect(rows).toEqual([{ depth: 2 }]);
            expect(changeLog?.entity).toBe(`${realm.id}:${ancestor.id}:${descendant.id}`);
            expect(changeLog?.entityType).toBe(RoleClosure.name);
            expect(changeLog?.delta).toMatchObject({ depth: { old: 1, new: 2 } });
            expect(result).toBe(1);
        });

        it("[case] - commits change log entries for a set-based statement executed by a repository", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "closure.tracked" });
            const ancestor = await suite.fixtures().createRole({ realm, code: "closure.tracked.ancestor" });
            const descendant = await suite.fixtures().createDetachedRole({ realm, code: "closure.tracked.descendant" });
            const repository = new RoleClosureRepository();

            // Act
            await suite.repository().service.run({
                audit: { ...AUDIT_PROPS, actionType: ActionType.CREATE },
                changeLog: true,
                execute: async (transaction) => {
                    await repository.insertNewHierarchy({
                        descendant: descendant.id,
                        ancestor: ancestor.id,
                        realm: realm.id,
                        transaction,
                    });
                },
            });

            const readManager = suite.repository().readManager;
            readManager.clear();
            const changeLogs = await readManager.find(ChangeLog, { entityType: RoleClosure.name });
            const result3 = await readManager.count(Outbox, { destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE });

            // Assert
            expect(changeLogs.map(({ entity }) => entity).sort()).toEqual(
                [`${realm.id}:${ancestor.id}:${descendant.id}`, `${realm.id}:${descendant.id}:${descendant.id}`].sort(),
            );
            expect(changeLogs.every(({ changeType }) => changeType === ChangeSetType.CREATE)).toBe(true);
            expect(result3).toBe(2);
        });

        it("[case] - rolls back and preserves external dependency errors raised during flush", async () => {
            // Arrange
            const externalError = new Error("vault unavailable");
            const logMaskingService = helper.createLogMaskingService({
                maskChangeLog: () => Promise.reject(externalError),
            });
            const service = helper.createTransactionalServiceContext({
                orm: suite.repository().orm,
                logMaskingService,
            }).service;

            // Act
            const result = service.run({
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
            });

            // Assert
            await expect(result).rejects.toBe(externalError);
            await helper.expectNoTransactionRows(suite.repository().readManager);
        });
    });

    describe("[Method] - emit", () => {
        it("[case] - emits audit log, audit archive and outbox without change log", async () => {
            // Arrange

            // Act
            await suite.repository().service.emit({
                audit: { ...AUDIT_PROPS, input: { password: "rejected-secret" } },
                payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
                actionType: AccessCacheTopicAction.INVALIDATE,
                destinationTopic: KafkaTopic.ACCESS_CACHE,
            });

            const readManager = suite.repository().readManager;
            readManager.clear();
            const auditLogs = await readManager.find(AuditLog, {});
            const result = await readManager.count(Outbox, { destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE });

            const result2 = await readManager.count(Outbox, { destinationTopic: KafkaTopic.ACCESS_CACHE });

            const result3 = await readManager.count(ChangeLog, {});

            // Assert
            expect(auditLogs).toHaveLength(1);
            expect(auditLogs[0]).toEqual(
                expect.objectContaining({
                    input: { password: "masked:rejected-secret" },
                    signature: expect.stringContaining("signed:AuditLog:"),
                    keyVersion: 7,
                }),
            );
            expect(result).toBe(1);
            expect(result2).toBe(1);
            expect(result3).toBe(0);
        });
    });

    describe("[Behavior] - consume with payload", () => {
        const props = {
            incoming: INCOMING_MESSAGE,
            audit: { ...AUDIT_PROPS, input: { password: "payload-secret" } },
            payload: { items: [{ scope: InvalidationScope.GLOBAL }] },
            actionType: AccessCacheTopicAction.INVALIDATE,
            destinationTopic: KafkaTopic.ACCESS_CACHE,
        } satisfies TransactionManager.Service.Consume.PayloadProps;

        it("[case] - commits the inbox, masked audit and payload exactly once", async () => {
            // Arrange
            const { service, readManager } = suite.repository();
            const first = await service.consume(props);
            const duplicate = await service.consume(props);

            // Act
            readManager.clear();
            const result = await readManager.count(Inbox, {});

            const result2 = await readManager.count(ChangeLog, {});

            const result3 = await readManager.count(Outbox, {});

            const result4 = await readManager.count(AuditLog, {});

            const audit = await readManager.findOneOrFail(AuditLog, { actor: AUDIT_PROPS.actor });
            const event = await readManager.findOneOrFail(Outbox, { destinationTopic: KafkaTopic.ACCESS_CACHE });

            // Assert
            expect(first).toEqual({ status: "processed", value: undefined });
            expect(duplicate).toEqual({ status: "duplicate" });
            expect(result).toBe(1);
            expect(result2).toBe(0);
            expect(result3).toBe(2);
            expect(result4).toBe(1);
            expect(audit.input).toEqual({ password: "masked:payload-secret" });
            expect(event.payload).toEqual(props.payload);
        });

        it("[case] - deduplicates concurrent payload deliveries", async () => {
            // Arrange
            const { service, readManager } = suite.repository();
            const outcomes = await Promise.all([service.consume(props), service.consume(props)]);

            // Act
            readManager.clear();
            const result2 = await readManager.count(Inbox, {});

            const result3 = await readManager.count(AuditLog, {});

            const result4 = await readManager.count(Outbox, {});

            // Assert
            expect(outcomes.map(({ status }) => status).sort()).toEqual(["duplicate", "processed"]);
            expect(result2).toBe(1);
            expect(result3).toBe(1);
            expect(result4).toBe(2);
        });

        it.each(["outbox", "audit"] as const)(
            "[case] - rolls back a failed %s and permits payload redelivery",
            async (stage) => {
                // Arrange
                const error = new Error("payload effects failed");
                const outboxService = helper.createOutboxService(
                    stage === "outbox"
                        ? {
                              buildAuditLogArchive: () => {
                                  throw error;
                              },
                          }
                        : {},
                );
                const logMaskingService = helper.createLogMaskingService(
                    stage === "audit"
                        ? {
                              sign: () => Promise.reject(error),
                          }
                        : {},
                );
                const { readManager, service } = suite.repository();
                const failing = helper.createTransactionalServiceContext({
                    orm: suite.repository().orm,
                    outboxService,
                    logMaskingService,
                }).service;

                // Act
                const result = failing.consume(props);
                await Promise.allSettled([result]);
                readManager.clear();
                const result2 = await readManager.count(Inbox, {});

                const result3 = await readManager.count(AuditLog, {});

                const result4 = await readManager.count(Outbox, {});

                const result5 = await readManager.count(ChangeLog, {});

                const result6 = await service.consume(props);

                readManager.clear();
                const result7 = await readManager.count(Inbox, {});

                const result8 = await readManager.count(AuditLog, {});

                const result9 = await readManager.count(Outbox, {});

                // Assert
                await expect(result).rejects.toBe(error);
                expect(result2).toBe(0);
                expect(result3).toBe(0);
                expect(result4).toBe(0);
                expect(result5).toBe(0);
                expect(result6).toEqual({ status: "processed", value: undefined });
                expect(result7).toBe(1);
                expect(result8).toBe(1);
                expect(result9).toBe(2);
            },
        );
    });
});
