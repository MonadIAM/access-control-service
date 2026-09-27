import { describe, expect, it } from "@jest/globals";

import { ExternalChanges } from "./external-changes";

const manager = (): ORM.FlushEventArgs["em"] => ({}) as ORM.FlushEventArgs["em"];
const change = (id: string): ORM.ChangeSet<ORM.AnyEntity> =>
    ({ entity: { id } }) as unknown as ORM.ChangeSet<ORM.AnyEntity>;

describe("ExternalChanges", () => {
    describe("drain", () => {
        it("returns an empty list for an unknown manager", () => {
            expect(ExternalChanges.drain({ entityManager: manager() })).toEqual([]);
        });
    });

    describe("record / drain", () => {
        it("accumulates changes in order, isolates managers and drains only once", () => {
            const first = manager();
            const second = manager();
            const a = change("a");
            const b = change("b");
            const c = change("c");
            ExternalChanges.record({ entityManager: first, changes: [a] });
            ExternalChanges.record({ entityManager: second, changes: [c] });
            ExternalChanges.record({ entityManager: first, changes: [b] });
            const drained = ExternalChanges.drain({ entityManager: first });
            expect(drained).toEqual([a, b]);
            expect(drained[0]).toBe(a);
            expect(ExternalChanges.drain({ entityManager: first })).toEqual([]);
            expect(ExternalChanges.drain({ entityManager: second })).toEqual([c]);
            ExternalChanges.record({ entityManager: first, changes: [c] });
            expect(ExternalChanges.drain({ entityManager: first })).toEqual([c]);
        });

        it("does not mutate or retain the caller's changes array", () => {
            const entityManager = manager();
            const a = change("a");
            const changes = [a];
            ExternalChanges.record({ entityManager, changes });
            ExternalChanges.record({ entityManager, changes: [] });
            expect(changes).toEqual([a]);
            changes.length = 0;
            expect(ExternalChanges.drain({ entityManager })).toEqual([a]);
        });
    });
});
