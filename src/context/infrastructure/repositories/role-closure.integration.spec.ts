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

describe("[Repository] - RoleClosure", () => {
    const suite = postgresSuite({
        repository: () => new RoleClosureRepository(),
        fixture: (entityManager) => new RoleClosureFixture(entityManager),
    });
    const postgresHelpers = new PostgresHelpers();

    describe("[Behavior] - schema mapping", () => {
        it("[case] - maps the persisted closure path through the schema", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm();
            const ancestor = await suite.fixtures().createDetachedRole({ realm, code: "mapping.ancestor" });
            const descendant = await suite.fixtures().createDetachedRole({ realm, code: "mapping.descendant" });
            await suite.fixtures().createRoleClosure({ realm, ancestor, descendant, depth: 2 });

            // Act
            const { paths } = await suite.transaction(async (transaction) => {
                const paths = await transaction.find(RoleClosure, {});
                return { paths };
            });

            // Assert
            expect(paths).toHaveLength(1);
            expect(paths[0]?.depth).toBe(2);
            expect(paths[0]?.ancestor.id).toBe(ancestor.id);
            expect(paths[0]?.descendant.id).toBe(descendant.id);
            expect(paths[0]?.realm.id).toBe(realm.id);
        });
    });

    describe("[Method] - insertNewHierarchy", () => {
        it("[case] - inserts inherited ancestor paths for a new hierarchy node", async () => {
            // Arrange
            const scenario = await suite.fixtures().insertScenario();

            // Act
            const { snapshot } = await suite.transaction(async (transaction) => {
                await suite.repository().insertNewHierarchy({
                    descendant: scenario.descendant.id,
                    ancestor: scenario.ancestor.id,
                    realm: scenario.realm.id,
                    transaction,
                });
                const snapshot = await postgresHelpers.getRoleClosurePathKeys({ transaction, realm: scenario.realm.id });
                return { snapshot };
            });

            // Assert
            expect(snapshot).toEqual([...scenario.expectedPathKeys].sort());
        });
    });

    describe("[Method] - move", () => {
        it("[case] - moves a subtree between parents and returns changed closure paths", async () => {
            // Arrange
            const scenario = await suite.fixtures().moveScenario();

            // Act
            const { result, pathKeys, hasNewParentPath, hasOldParentPath } = await suite.transaction(
                async (transaction) => {
                    const result = await suite.repository().move({
                        transaction,
                        newParent: scenario.newParent.id,
                        target: scenario.target.id,
                        realm: scenario.realm.id,
                    });
                    const pathKeys = await postgresHelpers.getRoleClosurePathKeys({
                        transaction,
                        realm: scenario.realm.id,
                    });
                    const hasNewParentPath = await suite.repository().existsTransitivePath({
                        descendant: scenario.targetChild.id,
                        ancestor: scenario.newParent.id,
                        realm: scenario.realm.id,
                        transaction,
                    });
                    const hasOldParentPath = await suite.repository().existsTransitivePath({
                        descendant: scenario.targetChild.id,
                        ancestor: scenario.oldParent.id,
                        realm: scenario.realm.id,
                        transaction,
                    });
                    return { result, pathKeys, hasNewParentPath, hasOldParentPath };
                },
            );

            // Assert
            expect(result.removedPaths.map(pathKey).sort()).toEqual(scenario.expectedRemovedPathKeys.sort());
            expect(result.upsertedPaths.map(depthPathKey).sort()).toEqual(scenario.expectedUpsertedPathKeys.sort());
            expect(pathKeys).toEqual([...scenario.expectedPathKeys].sort());
            expect(hasNewParentPath).toBe(true);
            expect(hasOldParentPath).toBe(false);
        });

        it("[case] - keeps closure paths unchanged when subtree move transaction is rolled back", async () => {
            // Arrange
            const scenario = await suite.fixtures().moveScenario();
            const rollbackError = new Error("Rollback subtree move");

            // Act
            const result = suite.transaction(async (transaction) => {
                await suite.repository().move({
                    transaction,
                    newParent: scenario.newParent.id,
                    target: scenario.target.id,
                    realm: scenario.realm.id,
                });

                throw rollbackError;
            });
            await Promise.allSettled([result]);
            const { pathKeys } = await suite.transaction(async (transaction) => {
                const pathKeys = await postgresHelpers.getRoleClosurePathKeys({
                    transaction,
                    realm: scenario.realm.id,
                });
                return { pathKeys };
            });

            // Assert
            await expect(result).rejects.toBe(rollbackError);
            expect(pathKeys).toEqual([...scenario.initialPathKeys].sort());
        });
    });

    describe("[Method] - moveSubtrees", () => {
        it("[case] - moves child subtrees between parents and returns changed closure paths", async () => {
            // Arrange
            const scenario = await suite.fixtures().moveSubtreesScenario();

            // Act
            const { result, pathKeys } = await suite.transaction(async (transaction) => {
                const result = await suite.repository().moveSubtrees({
                    children: scenario.children.map(({ id }) => id),
                    oldParent: scenario.oldParent.id,
                    newParent: scenario.newParent.id,
                    realm: scenario.realm.id,
                    transaction,
                });
                const pathKeys = await postgresHelpers.getRoleClosurePathKeys({
                    transaction,
                    realm: scenario.realm.id,
                });
                return { result, pathKeys };
            });

            // Assert
            expect(result.removedPaths.map(pathKey).sort()).toEqual(scenario.expectedRemovedPathKeys.sort());
            expect(result.upsertedPaths.map(depthPathKey).sort()).toEqual(scenario.expectedUpsertedPathKeys.sort());
            expect(pathKeys).toEqual([...scenario.expectedPathKeys].sort());
        });
    });

    describe("[Method] - decreaseTransitiveDepth", () => {
        it("[case] - decreases transitive depths around a removed role without changing role-owned paths", async () => {
            // Arrange
            const scenario = await suite.fixtures().decreaseDepthScenario();

            // Act
            const { pathKeys } = await suite.transaction(async (transaction) => {
                await suite.repository().decreaseTransitiveDepth({
                    role: scenario.role.id,
                    realm: scenario.realm.id,
                    transaction,
                });
                const pathKeys = await postgresHelpers.getRoleClosurePathKeys({
                    transaction,
                    realm: scenario.realm.id,
                });
                return { pathKeys };
            });

            // Assert
            expect(pathKeys).toEqual([...scenario.expectedPathKeys].sort());
        });
    });
});
