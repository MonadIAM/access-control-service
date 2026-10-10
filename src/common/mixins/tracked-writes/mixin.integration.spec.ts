import { ChangeSetType } from "@mikro-orm/postgresql";
import { describe, expect, it } from "@jest/globals";

import { TrackedWritesHelper } from "~testing/integration/mixins/tracked-writes.helpers";
import { ExternalChanges } from "~infrastructure/database/utils/external-changes";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { RoleClosure } from "~context/domain/entities";

import { TrackedWrites } from "./mixin";

class TestRepository extends TrackedWrites<Entities.RoleClosure>({ Entity: RoleClosure }) {
    public constructor(public readonly writeManager: ORM.EntityManager) {
        super();
    }
}

describe("[Mixin] - TrackedWrites", () => {
    const helper = new TrackedWritesHelper();
    const suite = postgresSuite({
        repository: ({ writeManager }) => new TestRepository(writeManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - write", () => {
        it("[case] - maps written rows into entities and records them as a create change set", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "tracked.create" });
            const ancestor = await suite.fixtures().createDetachedRole({ realm, code: "tracked.create.ancestor" });
            const descendant = await suite.fixtures().createDetachedRole({ realm, code: "tracked.create.descendant" });

            // Act
            const { paths, changeSet, remainingChanges } = await suite.transaction(async (transaction) => {
                const paths = await suite.repository().write({
                    query: helper.insertPathQuery({
                        descendant: descendant.id,
                        ancestor: ancestor.id,
                        realm: realm.id,
                        depth: 1,
                    }),
                    type: ChangeSetType.CREATE,
                    transaction,
                });
                const [changeSet] = ExternalChanges.drain({ entityManager: transaction });
                const remainingChanges = ExternalChanges.drain({ entityManager: transaction });
                return { paths, changeSet, remainingChanges };
            });

            // Assert
            expect(paths).toHaveLength(1);
            expect(paths[0]?.ancestor.id).toBe(ancestor.id);
            expect(paths[0]?.descendant.id).toBe(descendant.id);
            expect(paths[0]?.realm.id).toBe(realm.id);
            expect(paths[0]?.depth).toBe(1);
            expect(changeSet?.type).toBe(ChangeSetType.CREATE);
            expect(changeSet?.entity).toBe(paths[0]);
            expect(changeSet?.payload).toMatchObject({ depth: 1 });
            expect(changeSet?.originalEntity).toBeUndefined();
            expect(remainingChanges).toHaveLength(0);
        });

        it("[case] - leaves written rows managed so that a flush does not write them twice", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "tracked.managed" });
            const ancestor = await suite.fixtures().createDetachedRole({ realm, code: "tracked.managed.ancestor" });
            const descendant = await suite.fixtures().createDetachedRole({ realm, code: "tracked.managed.descendant" });

            // Act
            const { pathCount } = await suite.transaction(async (transaction) => {
                await suite.repository().write({
                    query: helper.insertPathQuery({
                        descendant: descendant.id,
                        ancestor: ancestor.id,
                        realm: realm.id,
                        depth: 1,
                    }),
                    type: ChangeSetType.CREATE,
                    transaction,
                });
                await transaction.flush();
                const pathCount = await transaction.count(RoleClosure, {});
                return { pathCount };
            });

            // Assert
            expect(pathCount).toBe(1);
        });

        it("[case] - forgets removed rows and records them as a delete change set", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "tracked.delete" });
            const ancestor = await suite.fixtures().createDetachedRole({ realm, code: "tracked.delete.ancestor" });
            const descendant = await suite.fixtures().createDetachedRole({ realm, code: "tracked.delete.descendant" });
            await suite.fixtures().createRoleClosure({ realm, ancestor, descendant, depth: 2 });

            // Act
            const { paths, identityMap, changeSet } = await suite.transaction(async (transaction) => {
                const paths = await suite.repository().write({
                    query: helper.deletePathsQuery({ realm: realm.id }),
                    type: ChangeSetType.DELETE,
                    transaction,
                });
                const identityMap = transaction
                    .getUnitOfWork()
                    .getIdentityMap()
                    .getStore(transaction.getMetadata(RoleClosure));
                const [changeSet] = ExternalChanges.drain({ entityManager: transaction });
                return { paths, identityMap, changeSet };
            });

            // Assert
            expect(paths).toHaveLength(1);
            expect([...identityMap.values()]).toHaveLength(0);
            expect(changeSet?.type).toBe(ChangeSetType.DELETE);
            expect(changeSet?.payload).toEqual({});
            expect(changeSet?.originalEntity).toMatchObject({ depth: 2 });
        });

        it("[case] - records an update change set from the previous state the statement returns", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "tracked.update" });
            const ancestor = await suite.fixtures().createDetachedRole({ realm, code: "tracked.update.ancestor" });
            const descendant = await suite.fixtures().createDetachedRole({ realm, code: "tracked.update.descendant" });
            await suite.fixtures().createRoleClosure({ realm, ancestor, descendant, depth: 1 });

            // Act
            const { paths, changeSet } = await suite.transaction(async (transaction) => {
                const paths = await suite.repository().write({
                    query: helper.increaseDepthQuery({ realm: realm.id }),
                    type: ChangeSetType.UPDATE,
                    transaction,
                });
                const [changeSet] = ExternalChanges.drain({ entityManager: transaction });
                return { paths, changeSet };
            });

            // Assert
            expect(paths[0]?.depth).toBe(2);
            expect(changeSet?.type).toBe(ChangeSetType.UPDATE);
            expect(changeSet?.payload).toMatchObject({ depth: 2 });
            expect(changeSet?.originalEntity).toMatchObject({ depth: 1 });
        });

        it("[case] - derives the change type per row from the previous state within one statement", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "tracked.upsert" });
            const ancestor = await suite.fixtures().createDetachedRole({ realm, code: "tracked.upsert.ancestor" });
            const rewritten = await suite.fixtures().createDetachedRole({ realm, code: "tracked.upsert.rewritten" });
            const added = await suite.fixtures().createDetachedRole({ realm, code: "tracked.upsert.added" });
            await suite.fixtures().createRoleClosure({ realm, ancestor, descendant: rewritten, depth: 1 });

            // Act
            const { byDescendant } = await suite.transaction(async (transaction) => {
                await suite.repository().write({
                    query: helper.upsertPathsQuery({
                        paths: [
                            { realm: realm.id, ancestor: ancestor.id, descendant: rewritten.id, depth: 5 },
                            { realm: realm.id, ancestor: ancestor.id, descendant: added.id, depth: 7 },
                        ],
                    }),
                    type: ChangeSetType.CREATE,
                    transaction,
                });
                const changeSets = ExternalChanges.drain({ entityManager: transaction });
                const byDescendant = new Map(changeSets.map((changeSet) => [changeSet.entity.descendant.id, changeSet]));
                return { byDescendant };
            });

            // Assert
            expect(byDescendant.get(rewritten.id)?.type).toBe(ChangeSetType.UPDATE);
            expect(byDescendant.get(rewritten.id)?.originalEntity).toMatchObject({ depth: 1 });
            expect(byDescendant.get(added.id)?.type).toBe(ChangeSetType.CREATE);
            expect(byDescendant.get(added.id)?.originalEntity).toBeUndefined();
        });

        it("[case] - records nothing when the statement returns no rows", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "tracked.empty" });

            // Act
            const { paths, recordedChanges } = await suite.transaction(async (transaction) => {
                const paths = await suite.repository().write({
                    query: helper.deletePathsQuery({ realm: realm.id }),
                    type: ChangeSetType.DELETE,
                    transaction,
                });
                const recordedChanges = ExternalChanges.drain({ entityManager: transaction });
                return { paths, recordedChanges };
            });

            // Assert
            expect(paths).toHaveLength(0);
            expect(recordedChanges).toHaveLength(0);
        });

        it("[case] - keeps recorded changes isolated per entity manager", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "tracked.isolation" });
            const ancestor = await suite.fixtures().createDetachedRole({ realm, code: "tracked.isolation.ancestor" });
            const descendant = await suite.fixtures().createDetachedRole({ realm, code: "tracked.isolation.descendant" });

            // Act
            const { otherChanges, currentChanges } = await suite.transaction(async (transaction) => {
                await suite.repository().write({
                    query: helper.insertPathQuery({
                        descendant: descendant.id,
                        ancestor: ancestor.id,
                        realm: realm.id,
                        depth: 1,
                    }),
                    type: ChangeSetType.CREATE,
                    transaction,
                });
                const other = suite.repository().writeManager.fork();
                const otherChanges = ExternalChanges.drain({ entityManager: other });
                const currentChanges = ExternalChanges.drain({ entityManager: transaction });
                return { otherChanges, currentChanges };
            });

            // Assert
            expect(otherChanges).toHaveLength(0);
            expect(currentChanges).toHaveLength(1);
        });
    });
});
