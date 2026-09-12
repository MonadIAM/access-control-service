import { describe, expect, it } from "@jest/globals";

import { DeltaChanges } from "./delta-changes";

describe("DeltaChanges Value Object", () => {
    describe("constructor", () => {
        it("should assign changes as enumerable fields", () => {
            const delta = new DeltaChanges({
                name: { old: "Old Name", new: "New Name" },
            });

            expect(delta.name).toEqual({ old: "Old Name", new: "New Name" });
            expect(Object.entries(delta)).toEqual([["name", { old: "Old Name", new: "New Name" }]]);
        });

        it("should freeze the record and stored change objects", () => {
            const delta = new DeltaChanges({
                token: { old: "old-token", new: "new-token" },
            });

            expect(Reflect.set(delta, "password", { old: null, new: "secret" })).toBe(false);
            expect(Reflect.set(delta, "token", { old: null, new: "secret" })).toBe(false);
            expect(delta.token).toEqual({ old: "old-token", new: "new-token" });
            expect(Reflect.set(delta.token, "old", "tampered")).toBe(false);
            expect(Reflect.set(delta.token, "new", "tampered")).toBe(false);
            expect(Object.isFrozen(delta.token)).toBe(true);
            expect(Object.isFrozen(delta)).toBe(true);
        });

        it("should recursively freeze nested stored values", () => {
            const delta = new DeltaChanges({
                metadata: {
                    old: { permissions: ["read"] },
                    new: { permissions: ["read", "write"] },
                },
            });
            const current = delta.metadata.new as { permissions: string[] };

            expect(delta.metadata.new).toEqual({ permissions: ["read", "write"] });
            expect(Reflect.set(current, "permissions", ["admin"])).toBe(false);
            expect(Reflect.set(current.permissions, 0, "admin")).toBe(false);
            expect(Object.isFrozen(current.permissions)).toBe(true);
            expect(Object.isFrozen(delta.metadata.old)).toBe(true);
            expect(Object.isFrozen(current)).toBe(true);
        });
    });
});
