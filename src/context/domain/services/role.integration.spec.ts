import { describe, expect, it } from "@jest/globals";
import { ChangeSetType } from "@mikro-orm/core";
import { randomUUID } from "node:crypto";

import { ActionType, EntityType, MoveMode, RoleActorType, RoleArchetype } from "~context/enums";
import { RoleIntegrationHelpers } from "~testing/integration/domain-service/role.helpers";
import { PostgresHelpers } from "~testing/integration/containers/postgres.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { AuditLog, ChangeLog } from "~common/transaction-manager";
import { RoleClosure, Role } from "~context/domain/entities";

const helpers = new RoleIntegrationHelpers();
const postgresHelpers = new PostgresHelpers();

async function loadClosureKeys(suite: Integration.Domain.Role.Suite, realm: Entities.Realm): Promise<string[]> {
    return await suite.transaction((transaction) =>
        postgresHelpers.getRoleClosurePathKeys({
            realm: realm.id,
            transaction,
        }),
    );
}

async function loadDirectParent(
    suite: Integration.Domain.Role.Suite,
    role: Entities.Role,
): Promise<Nullable<Entities.Role>> {
    return await suite.transaction(async (transaction) => {
        const relation = await transaction.findOne(
            RoleClosure,
            { descendant: role.id, depth: 1 },
            { populate: ["ancestor"] },
        );

        return relation?.ancestor ?? null;
    });
}

async function loadRoleByCode(
    suite: Integration.Domain.Role.Suite,
    realm: Entities.Realm,
    code: string,
): Promise<Entities.Role> {
    return await suite.transaction((transaction) => transaction.findOneOrFail(Role, { realm: realm.id, code }));
}

async function countRolesByCode(
    suite: Integration.Domain.Role.Suite,
    realm: Entities.Realm,
    code: string,
): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(Role, { realm: realm.id, code }));
}

async function countRoleRows(suite: Integration.Domain.Role.Suite, realm: Entities.Realm): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(Role, { realm: realm.id }));
}

function closureKey(ancestor: Entities.Role, descendant: Entities.Role, depth: number): string {
    return `${ancestor.id}:${descendant.id}:${depth}`;
}

describe("RoleService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("create", () => {
        it("creates a role under parent with persisted closure paths", async () => {
            const realm = await suite.fixtures().createRealm({ code: "role-create" });
            const root = await suite.fixtures().createRole({
                archetype: RoleArchetype.COMPOSITE,
                code: "roles.root",
                name: "Root",
                realm,
            });

            const result = await suite.transaction((transaction) =>
                suite.repository().roleService.create({
                    input: {
                        archetype: RoleArchetype.ATOMIC,
                        actorType: RoleActorType.HUMAN,
                        code: "roles.child",
                        name: "Child",
                        parent: root.id,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );

            const child = await loadRoleByCode(suite, realm, "roles.child");
            const parent = await loadDirectParent(suite, child);
            const closure = await loadClosureKeys(suite, realm);

            expect(result.parent.id).toBe(root.id);
            expect(result.entity.id).toBe(child.id);
            expect(parent?.id).toBe(root.id);
            expect(closure).toEqual(
                expect.arrayContaining([
                    closureKey(root, root, 0),
                    closureKey(child, child, 0),
                    closureKey(root, child, 1),
                ]),
            );
        });

        it("creates a role and moves direct children under it", async () => {
            const realm = await suite.fixtures().createRealm({ code: "role-create-children" });
            const root = await suite.fixtures().createRole({
                archetype: RoleArchetype.COMPOSITE,
                code: "roles.root",
                name: "Root",
                realm,
            });
            const first = await suite.fixtures().createRole({ code: "roles.first", name: "First", realm });
            const second = await suite.fixtures().createRole({ code: "roles.second", name: "Second", realm });

            await helpers.createHierarchy({
                fixtures: suite.fixtures(),
                realm,
                ancestor: root,
                descendant: first,
                depth: 1,
            });
            await helpers.createHierarchy({
                fixtures: suite.fixtures(),
                realm,
                ancestor: root,
                descendant: second,
                depth: 1,
            });

            await suite.transaction((transaction) =>
                suite.repository().roleService.create({
                    input: {
                        children: [first.id, second.id],
                        archetype: RoleArchetype.COMPOSITE,
                        actorType: RoleActorType.HUMAN,
                        code: "roles.branch",
                        name: "Branch",
                        parent: root.id,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );

            const branch = await loadRoleByCode(suite, realm, "roles.branch");
            const firstParent = await loadDirectParent(suite, first);
            const secondParent = await loadDirectParent(suite, second);
            const closure = await loadClosureKeys(suite, realm);

            expect(firstParent?.id).toBe(branch.id);
            expect(secondParent?.id).toBe(branch.id);
            expect(closure).toEqual(
                expect.arrayContaining([
                    closureKey(root, branch, 1),
                    closureKey(branch, first, 1),
                    closureKey(branch, second, 1),
                    closureKey(root, first, 2),
                    closureKey(root, second, 2),
                ]),
            );
        });

        it("rolls back role and closure when a requested child is not direct", async () => {
            const realm = await suite.fixtures().createRealm({ code: "role-create-rollback" });
            const root = await suite.fixtures().createRole({
                archetype: RoleArchetype.COMPOSITE,
                code: "roles.root",
                name: "Root",
                realm,
            });
            const child = await suite.fixtures().createRole({ code: "roles.child", name: "Child", realm });
            const grandchild = await suite.fixtures().createRole({ code: "roles.grandchild", name: "Grandchild", realm });

            await helpers.createHierarchy({
                fixtures: suite.fixtures(),
                realm,
                ancestor: root,
                descendant: child,
                depth: 1,
            });
            await helpers.createHierarchy({
                fixtures: suite.fixtures(),
                realm,
                ancestor: child,
                descendant: grandchild,
                depth: 1,
            });
            await helpers.createHierarchy({
                fixtures: suite.fixtures(),
                realm,
                ancestor: root,
                descendant: grandchild,
                depth: 2,
            });

            const roleCount = await countRoleRows(suite, realm);
            const closure = await loadClosureKeys(suite, realm);

            await expect(
                suite.transaction((transaction) =>
                    suite.repository().roleService.create({
                        input: {
                            children: [grandchild.id],
                            archetype: RoleArchetype.COMPOSITE,
                            actorType: RoleActorType.HUMAN,
                            code: "roles.invalid",
                            name: "Invalid",
                            parent: root.id,
                        },
                        realm: realm.id,
                        transaction,
                    }),
                ),
            ).rejects.toThrow("services.role.CREATE_CHILD_NOT_DIRECT_DESCENDANT");

            await expect(countRolesByCode(suite, realm, "roles.invalid")).resolves.toBe(0);
            await expect(countRoleRows(suite, realm)).resolves.toBe(roleCount);
            await expect(loadClosureKeys(suite, realm)).resolves.toEqual(closure);
        });
    });

    describe("move", () => {
        it("moves a subtree under a new parent", async () => {
            const tree = await helpers.createDeepRoleTree({ fixtures: suite.fixtures(), code: "role-move-subtree" });

            await suite.transaction((transaction) =>
                suite.repository().roleService.move({
                    targetParent: tree.roles.detached.id,
                    mode: MoveMode.SUBTREE,
                    target: tree.roles.child.id,
                    realm: tree.realm.id,
                    transaction,
                }),
            );

            const childParent = await loadDirectParent(suite, tree.roles.child);
            const grandchildParent = await loadDirectParent(suite, tree.roles.grandchild);
            const closure = await loadClosureKeys(suite, tree.realm);

            expect(childParent?.id).toBe(tree.roles.detached.id);
            expect(grandchildParent?.id).toBe(tree.roles.child.id);
            expect(closure).toEqual(
                expect.arrayContaining([
                    closureKey(tree.roles.detached, tree.roles.child, 1),
                    closureKey(tree.roles.detached, tree.roles.grandchild, 2),
                ]),
            );
        });

        it("moves a role in parallel and leaves its children under the old parent", async () => {
            const tree = await helpers.createDeepRoleTree({ fixtures: suite.fixtures(), code: "role-move-parallel" });

            await suite.transaction((transaction) =>
                suite.repository().roleService.move({
                    targetParent: tree.roles.detached.id,
                    mode: MoveMode.PARALLEL,
                    target: tree.roles.child.id,
                    realm: tree.realm.id,
                    transaction,
                }),
            );

            const expectedClosure = [
                closureKey(tree.roles.child, tree.roles.child, 0),
                closureKey(tree.roles.detached, tree.roles.child, 1),
                closureKey(tree.roles.detached, tree.roles.detached, 0),
                closureKey(tree.roles.grandchild, tree.roles.grandchild, 0),
                closureKey(tree.roles.parent, tree.roles.grandchild, 1),
                closureKey(tree.roles.parent, tree.roles.parent, 0),
                closureKey(tree.roles.root, tree.roles.child, 2),
                closureKey(tree.roles.root, tree.roles.detached, 1),
                closureKey(tree.roles.root, tree.roles.grandchild, 2),
                closureKey(tree.roles.root, tree.roles.parent, 1),
                closureKey(tree.roles.root, tree.roles.root, 0),
            ].sort();

            await expect(loadClosureKeys(suite, tree.realm)).resolves.toEqual(expectedClosure);
        });

        it("moves a role linearly and places displaced children under the target", async () => {
            const realm = await suite.fixtures().createRealm({ code: "role-move-linear" });
            const root = await suite.fixtures().createRole({
                archetype: RoleArchetype.COMPOSITE,
                code: "roles.root",
                name: "Root",
                realm,
            });
            const parent = await suite.fixtures().createRole({
                archetype: RoleArchetype.COMPOSITE,
                code: "roles.parent",
                name: "Parent",
                realm,
            });
            const displaced = await suite.fixtures().createRole({ code: "roles.displaced", name: "Displaced", realm });
            const target = await suite.fixtures().createRole({ code: "roles.target", name: "Target", realm });

            await helpers.createHierarchy({
                fixtures: suite.fixtures(),
                realm,
                ancestor: root,
                descendant: parent,
                depth: 1,
            });
            await helpers.createHierarchy({
                fixtures: suite.fixtures(),
                realm,
                ancestor: root,
                descendant: target,
                depth: 1,
            });
            await helpers.createHierarchy({
                fixtures: suite.fixtures(),
                realm,
                ancestor: parent,
                descendant: displaced,
                depth: 1,
            });
            await helpers.createHierarchy({
                fixtures: suite.fixtures(),
                realm,
                ancestor: root,
                descendant: displaced,
                depth: 2,
            });

            await suite.transaction((transaction) =>
                suite.repository().roleService.move({
                    targetParent: parent.id,
                    mode: MoveMode.LINEAR,
                    target: target.id,
                    realm: realm.id,
                    transaction,
                }),
            );

            const expectedClosure = [
                closureKey(displaced, displaced, 0),
                closureKey(parent, displaced, 2),
                closureKey(parent, parent, 0),
                closureKey(parent, target, 1),
                closureKey(root, displaced, 3),
                closureKey(root, parent, 1),
                closureKey(root, root, 0),
                closureKey(root, target, 2),
                closureKey(target, displaced, 1),
                closureKey(target, target, 0),
            ].sort();

            await expect(loadClosureKeys(suite, realm)).resolves.toEqual(expectedClosure);
        });

        it("moves a role in parallel under its former child without creating closure cycles", async () => {
            const tree = await helpers.createDeepRoleTree({ fixtures: suite.fixtures(), code: "role-move-parallel-cycle" });

            await suite.transaction((transaction) =>
                suite.repository().roleService.move({
                    targetParent: tree.roles.child.id,
                    mode: MoveMode.PARALLEL,
                    target: tree.roles.parent.id,
                    realm: tree.realm.id,
                    transaction,
                }),
            );

            const expectedClosure = [
                closureKey(tree.roles.child, tree.roles.child, 0),
                closureKey(tree.roles.child, tree.roles.grandchild, 1),
                closureKey(tree.roles.child, tree.roles.parent, 1),
                closureKey(tree.roles.detached, tree.roles.detached, 0),
                closureKey(tree.roles.grandchild, tree.roles.grandchild, 0),
                closureKey(tree.roles.parent, tree.roles.parent, 0),
                closureKey(tree.roles.root, tree.roles.child, 1),
                closureKey(tree.roles.root, tree.roles.detached, 1),
                closureKey(tree.roles.root, tree.roles.grandchild, 2),
                closureKey(tree.roles.root, tree.roles.parent, 2),
                closureKey(tree.roles.root, tree.roles.root, 0),
            ].sort();

            await expect(loadClosureKeys(suite, tree.realm)).resolves.toEqual(expectedClosure);
        });

        it("moves a role linearly under its former child without creating closure cycles", async () => {
            const tree = await helpers.createDeepRoleTree({ fixtures: suite.fixtures(), code: "role-move-linear-cycle" });

            await suite.transaction((transaction) =>
                suite.repository().roleService.move({
                    targetParent: tree.roles.child.id,
                    mode: MoveMode.LINEAR,
                    target: tree.roles.parent.id,
                    realm: tree.realm.id,
                    transaction,
                }),
            );

            const expectedClosure = [
                closureKey(tree.roles.child, tree.roles.child, 0),
                closureKey(tree.roles.child, tree.roles.grandchild, 2),
                closureKey(tree.roles.child, tree.roles.parent, 1),
                closureKey(tree.roles.detached, tree.roles.detached, 0),
                closureKey(tree.roles.grandchild, tree.roles.grandchild, 0),
                closureKey(tree.roles.parent, tree.roles.grandchild, 1),
                closureKey(tree.roles.parent, tree.roles.parent, 0),
                closureKey(tree.roles.root, tree.roles.child, 1),
                closureKey(tree.roles.root, tree.roles.detached, 1),
                closureKey(tree.roles.root, tree.roles.grandchild, 3),
                closureKey(tree.roles.root, tree.roles.parent, 2),
                closureKey(tree.roles.root, tree.roles.root, 0),
            ].sort();

            await expect(loadClosureKeys(suite, tree.realm)).resolves.toEqual(expectedClosure);
        });
    });

    describe("purge", () => {
        it("purges a revoked middle role and decreases transitive closure depth", async () => {
            const tree = await helpers.createDeepRoleTree({ fixtures: suite.fixtures(), code: "role-purge-single" });

            await suite.transaction(async (transaction) => {
                const role = await transaction.findOneOrFail(Role, { id: tree.roles.child.id }, { populate: ["realm"] });

                role.revoke();
            });

            await suite.transaction((transaction) =>
                suite.repository().roleService.purge({
                    id: tree.roles.child.id,
                    realm: tree.realm.id,
                    transaction,
                }),
            );

            const expectedClosure = [
                closureKey(tree.roles.detached, tree.roles.detached, 0),
                closureKey(tree.roles.grandchild, tree.roles.grandchild, 0),
                closureKey(tree.roles.parent, tree.roles.grandchild, 1),
                closureKey(tree.roles.parent, tree.roles.parent, 0),
                closureKey(tree.roles.root, tree.roles.detached, 1),
                closureKey(tree.roles.root, tree.roles.grandchild, 2),
                closureKey(tree.roles.root, tree.roles.parent, 1),
                closureKey(tree.roles.root, tree.roles.root, 0),
            ].sort();

            await expect(countRolesByCode(suite, tree.realm, "roles.child")).resolves.toBe(0);
            await expect(loadClosureKeys(suite, tree.realm)).resolves.toEqual(expectedClosure);
        });

        it("records the closure depth decrease in change log during single role purge", async () => {
            const tree = await helpers.createDeepRoleTree({ fixtures: suite.fixtures(), code: "role-purge-change-log" });

            await suite.transaction(async (transaction) => {
                const role = await transaction.findOneOrFail(Role, { id: tree.roles.child.id }, { populate: ["realm"] });

                role.revoke();
            });

            await suite.repository().transactional.service.run({
                audit: {
                    context: {
                        ip: "127.0.0.1",
                        userAgent: "role-integration",
                    },
                    actionType: ActionType.DELETE,
                    entityType: EntityType.ROLE,
                    actor: randomUUID(),
                    realm: tree.realm.id,
                },
                changeLog: true,
                execute: (transaction) =>
                    suite.repository().roleService.purge({
                        id: tree.roles.child.id,
                        realm: tree.realm.id,
                        transaction,
                    }),
            });

            const readManager = suite.repository().transactional.readManager;
            readManager.clear();
            const [auditLog] = await readManager.find(AuditLog, {});
            const changeLogs = await readManager.find(ChangeLog, {});

            const closureLogs = changeLogs.filter(({ entityType }) => entityType === "RoleClosure");

            expect(changeLogs).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        auditEntry: auditLog.id,
                        changeType: ChangeSetType.DELETE,
                        entity: tree.roles.child.id,
                        entityType: "Role",
                    }),
                ]),
            );
            expect(closureLogs).toHaveLength(2);
            expect(closureLogs).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        entity: `${tree.realm.id}:${tree.roles.root.id}:${tree.roles.grandchild.id}`,
                        delta: expect.objectContaining({ depth: { old: 3, new: 2 } }),
                        changeType: ChangeSetType.UPDATE,
                        auditEntry: auditLog.id,
                    }),
                    expect.objectContaining({
                        entity: `${tree.realm.id}:${tree.roles.parent.id}:${tree.roles.grandchild.id}`,
                        delta: expect.objectContaining({ depth: { old: 2, new: 1 } }),
                        changeType: ChangeSetType.UPDATE,
                        auditEntry: auditLog.id,
                    }),
                ]),
            );
        });
    });

    describe("purgeSubtree", () => {
        it("purges a revoked role subtree and all closure rows", async () => {
            const tree = await helpers.createDeepRoleTree({ fixtures: suite.fixtures(), code: "role-purge-subtree" });

            await suite.transaction(async (transaction) => {
                const roles = await transaction.find(
                    Role,
                    { id: { $in: [tree.roles.parent.id, tree.roles.child.id, tree.roles.grandchild.id] } },
                    { populate: ["realm"] },
                );

                for (const role of roles) {
                    role.revoke();
                }
            });

            await suite.transaction((transaction) =>
                suite.repository().roleService.purgeSubtree({
                    id: tree.roles.parent.id,
                    realm: tree.realm.id,
                    transaction,
                }),
            );

            await expect(countRolesByCode(suite, tree.realm, "roles.parent")).resolves.toBe(0);
            await expect(countRolesByCode(suite, tree.realm, "roles.child")).resolves.toBe(0);
            await expect(countRolesByCode(suite, tree.realm, "roles.grandchild")).resolves.toBe(0);
            const expectedClosure = [
                closureKey(tree.roles.detached, tree.roles.detached, 0),
                closureKey(tree.roles.root, tree.roles.detached, 1),
                closureKey(tree.roles.root, tree.roles.root, 0),
            ].sort();

            await expect(loadClosureKeys(suite, tree.realm)).resolves.toEqual(expectedClosure);
        });
    });
});
