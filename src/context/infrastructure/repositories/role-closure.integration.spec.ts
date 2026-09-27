import { describe, expect, it } from "@jest/globals";

import { RoleClosureRepository } from "~context/infrastructure/repositories/role-closure.repository";
import { RoleClosureFixture } from "~testing/integration/repositories/role-closure.fixture";
import { PostgresHelpers } from "~testing/integration/containers/postgres.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { RoleClosure } from "~context/domain/entities";

function pathKey(path: Omit<Entities.RoleClosure, "realm" | "depth">): string {
    return `${path.ancestor.id}:${path.descendant.id}`;
}

function depthPathKey(path: Omit<Entities.RoleClosure, "realm">): string {
    return `${path.ancestor.id}:${path.descendant.id}:${path.depth}`;
}

describe("RoleClosureRepository", () => {
    const suite = postgresSuite({
        repository: () => new RoleClosureRepository(),
        fixture: (entityManager) => new RoleClosureFixture(entityManager),
    });
    const postgresHelpers = new PostgresHelpers();

    describe("schema mapping", () => {
        it("maps the persisted closure path through the schema", async () => {
            const realm = await suite.fixtures().createRealm();
            const ancestor = await suite.fixtures().createDetachedRole({ realm, code: "mapping.ancestor" });
            const descendant = await suite.fixtures().createDetachedRole({ realm, code: "mapping.descendant" });
            await suite.fixtures().createRoleClosure({ realm, ancestor, descendant, depth: 2 });

            await suite.transaction(async (transaction) => {
                const paths = await transaction.find(RoleClosure, {});

                expect(paths).toHaveLength(1);
                expect(paths[0]?.depth).toBe(2);
                expect(paths[0]?.ancestor.id).toBe(ancestor.id);
                expect(paths[0]?.descendant.id).toBe(descendant.id);
                expect(paths[0]?.realm.id).toBe(realm.id);
            });
        });
    });

    describe("insertNewHierarchy", () => {
        it("inserts inherited ancestor paths for a new hierarchy node", async () => {
            const scenario = await suite.fixtures().insertScenario();

            await suite.transaction(async (transaction) => {
                await suite.repository().insertNewHierarchy({
                    descendant: scenario.descendant.id,
                    ancestor: scenario.ancestor.id,
                    realm: scenario.realm.id,
                    transaction,
                });

                const snapshot = await postgresHelpers.getRoleClosurePathKeys({ transaction, realm: scenario.realm.id });

                expect(snapshot).toEqual([...scenario.expectedPathKeys].sort());
            });
        });
    });

    describe("move", () => {
        it("moves a subtree between parents and returns changed closure paths", async () => {
            const scenario = await suite.fixtures().moveScenario();

            await suite.transaction(async (transaction) => {
                const result = await suite.repository().move({
                    transaction,
                    newParent: scenario.newParent.id,
                    target: scenario.target.id,
                    realm: scenario.realm.id,
                });

                expect(result.removedPaths.map(pathKey).sort()).toEqual(scenario.expectedRemovedPathKeys.sort());
                expect(result.upsertedPaths.map(depthPathKey).sort()).toEqual(scenario.expectedUpsertedPathKeys.sort());
                await expect(
                    postgresHelpers.getRoleClosurePathKeys({ transaction, realm: scenario.realm.id }),
                ).resolves.toEqual([...scenario.expectedPathKeys].sort());
                await expect(
                    suite.repository().existsTransitivePath({
                        descendant: scenario.targetChild.id,
                        ancestor: scenario.newParent.id,
                        realm: scenario.realm.id,
                        transaction,
                    }),
                ).resolves.toBe(true);
                await expect(
                    suite.repository().existsTransitivePath({
                        descendant: scenario.targetChild.id,
                        ancestor: scenario.oldParent.id,
                        realm: scenario.realm.id,
                        transaction,
                    }),
                ).resolves.toBe(false);
            });
        });

        it("keeps closure paths unchanged when subtree move transaction is rolled back", async () => {
            const scenario = await suite.fixtures().moveScenario();
            const rollbackError = new Error("Rollback subtree move");

            await expect(
                suite.transaction(async (transaction) => {
                    await suite.repository().move({
                        transaction,
                        newParent: scenario.newParent.id,
                        target: scenario.target.id,
                        realm: scenario.realm.id,
                    });

                    throw rollbackError;
                }),
            ).rejects.toBe(rollbackError);

            await suite.transaction(async (transaction) => {
                await expect(
                    postgresHelpers.getRoleClosurePathKeys({ transaction, realm: scenario.realm.id }),
                ).resolves.toEqual([...scenario.initialPathKeys].sort());
            });
        });
    });

    describe("moveSubtrees", () => {
        it("moves child subtrees between parents and returns changed closure paths", async () => {
            const scenario = await suite.fixtures().moveSubtreesScenario();

            await suite.transaction(async (transaction) => {
                const result = await suite.repository().moveSubtrees({
                    children: scenario.children.map(({ id }) => id),
                    oldParent: scenario.oldParent.id,
                    newParent: scenario.newParent.id,
                    realm: scenario.realm.id,
                    transaction,
                });

                expect(result.removedPaths.map(pathKey).sort()).toEqual(scenario.expectedRemovedPathKeys.sort());
                expect(result.upsertedPaths.map(depthPathKey).sort()).toEqual(scenario.expectedUpsertedPathKeys.sort());
                await expect(
                    postgresHelpers.getRoleClosurePathKeys({ transaction, realm: scenario.realm.id }),
                ).resolves.toEqual([...scenario.expectedPathKeys].sort());
            });
        });
    });

    describe("decreaseTransitiveDepth", () => {
        it("decreases transitive depths around a removed role without changing role-owned paths", async () => {
            const scenario = await suite.fixtures().decreaseDepthScenario();

            await suite.transaction(async (transaction) => {
                await suite.repository().decreaseTransitiveDepth({
                    role: scenario.role.id,
                    realm: scenario.realm.id,
                    transaction,
                });

                await expect(
                    postgresHelpers.getRoleClosurePathKeys({ transaction, realm: scenario.realm.id }),
                ).resolves.toEqual([...scenario.expectedPathKeys].sort());
            });
        });
    });
});
