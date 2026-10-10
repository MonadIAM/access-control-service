import { describe, expect, it } from "@jest/globals";

import { DeltaChanges } from "./delta-changes";

describe("[ValueObject] - DeltaChanges", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns changes as enumerable fields", () => {
            // Arrange

            // Act
            const delta = new DeltaChanges({
                name: { old: "Old Name", new: "New Name" },
            });
            const result = Object.entries(delta);

            // Assert
            expect(delta.name).toEqual({ old: "Old Name", new: "New Name" });
            expect(result).toEqual([["name", { old: "Old Name", new: "New Name" }]]);
        });

        it("[case] - freezes the record and stored change objects", () => {
            // Arrange

            // Act
            const delta = new DeltaChanges({
                token: { old: "old-token", new: "new-token" },
            });

            const result = Reflect.set(delta, "password", { old: null, new: "secret" });
            const result2 = Reflect.set(delta, "token", { old: null, new: "secret" });
            const result3 = Reflect.set(delta.token, "old", "tampered");
            const result4 = Reflect.set(delta.token, "new", "tampered");
            const result5 = Object.isFrozen(delta.token);
            const result6 = Object.isFrozen(delta);

            // Assert
            expect(result).toBe(false);
            expect(result2).toBe(false);
            expect(delta.token).toEqual({ old: "old-token", new: "new-token" });
            expect(result3).toBe(false);
            expect(result4).toBe(false);
            expect(result5).toBe(true);
            expect(result6).toBe(true);
        });

        it("[case] - freezes nested values recursively", () => {
            // Arrange

            // Act
            const delta = new DeltaChanges({
                metadata: {
                    old: { permissions: ["read"] },
                    new: { permissions: ["read", "write"] },
                },
            });

            const current = delta.metadata.new as { permissions: string[] };
            const result = Reflect.set(current, "permissions", ["admin"]);
            const result2 = Reflect.set(current.permissions, 0, "admin");
            const result3 = Object.isFrozen(current.permissions);
            const result4 = Object.isFrozen(delta.metadata.old);
            const result5 = Object.isFrozen(current);

            // Assert
            expect(delta.metadata.new).toEqual({ permissions: ["read", "write"] });
            expect(result).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(true);
            expect(result4).toBe(true);
            expect(result5).toBe(true);
        });
    });
});
