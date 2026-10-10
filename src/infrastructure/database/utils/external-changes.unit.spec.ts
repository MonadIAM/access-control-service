import { describe, expect, it } from "@jest/globals";

import { ExternalChanges } from "./external-changes";

const manager = (): ORM.FlushEventArgs["em"] => ({}) as ORM.FlushEventArgs["em"];
const change = (id: string): ORM.ChangeSet<ORM.AnyEntity> =>
    ({ entity: { id } }) as unknown as ORM.ChangeSet<ORM.AnyEntity>;

describe("[Utility] - ExternalChanges", () => {
    describe("[Method] - drain", () => {
        it("[case] - returns an empty list for an unknown manager", () => {
            // Arrange

            // Act
            const result = ExternalChanges.drain({ entityManager: manager() });

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe("[Behavior] - change collection", () => {
        it("[case] - accumulates changes in order, isolates managers and drains only once", () => {
            // Arrange
            const first = manager();
            const second = manager();
            const a = change("a");
            const b = change("b");
            const c = change("c");
            ExternalChanges.record({ entityManager: first, changes: [a] });
            ExternalChanges.record({ entityManager: second, changes: [c] });
            ExternalChanges.record({ entityManager: first, changes: [b] });

            // Act
            const drained = ExternalChanges.drain({ entityManager: first });
            const result = ExternalChanges.drain({ entityManager: first });
            const result2 = ExternalChanges.drain({ entityManager: second });
            ExternalChanges.record({ entityManager: first, changes: [c] });
            const result3 = ExternalChanges.drain({ entityManager: first });

            // Assert
            expect(drained).toEqual([a, b]);
            expect(drained[0]).toBe(a);
            expect(result).toEqual([]);
            expect(result2).toEqual([c]);
            expect(result3).toEqual([c]);
        });

        it("[case] - does not mutate or retain the caller's changes array", () => {
            // Arrange
            const entityManager = manager();
            const a = change("a");
            const changes = [a];
            ExternalChanges.record({ entityManager, changes });
            ExternalChanges.record({ entityManager, changes: [] });

            // Act
            const callerChanges = changes.slice();
            changes.length = 0;
            const result = ExternalChanges.drain({ entityManager });

            // Assert
            expect(callerChanges).toEqual([a]);
            expect(result).toEqual([a]);
        });
    });
});
