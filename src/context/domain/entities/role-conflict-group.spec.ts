import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { RoleConflictGroup } from "./role-conflict-group.entity";
import { Realm } from "./realm.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000000";

function createGroup(overrides?: Partial<Entities.RoleConflictGroup.ConstructorProps>): RoleConflictGroup {
    return new RoleConflictGroup({
        actor: ACTOR_ID,
        code: "SoD_FINANCE",
        name: "Finance Separation",
        maxAllowed: 1,
        realm: {} as Realm,
        ...overrides,
    });
}

describe("RoleConflictGroup Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const realm = {} as Realm;

            const group = new RoleConflictGroup({
                actor: ACTOR_ID,
                code: "SoD_OPS",
                name: "Ops Separation",
                maxAllowed: 2,
                realm,
            });

            expect(group.code).toBe("SoD_OPS");
            expect(group.name).toBe("Ops Separation");
            expect(group.maxAllowed).toBe(2);
            expect(group.realm).toBe(realm);
        });

        it("should default booleans to false", () => {
            const group = createGroup();

            expect(group.isSystemManaged).toBe(false);
            expect(group.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const group = createGroup({ isSystemManaged: true, isRevoked: true });

            expect(group.isSystemManaged).toBe(true);
            expect(group.isRevoked).toBe(true);
        });

        it("should auto-generate id, createdAt, version", () => {
            const group = createGroup();

            expect(isUUID(group.id, "4")).toBe(true);
            expect(group.createdAt).toBeInstanceOf(Date);
            expect(group.version).toBe(1);
            expect(group.updatedAt).toBeUndefined();
        });

        it("should populate lastActions.create", () => {
            const group = createGroup();

            expect(group.lastActions).toEqual({ create: { by: { id: ACTOR_ID } } });
        });

        it("should assign description when provided", () => {
            const group = createGroup({ description: "Prevents dual control" });
            expect(group.description).toBe("Prevents dual control");
        });

        it("should leave description undefined when omitted", () => {
            const group = createGroup();
            expect(group.description).toBeUndefined();
        });
    });

    describe("changeMetadata", () => {
        it("should update a single field and return patch", () => {
            const group = createGroup({ name: "Old" });

            const patch = group.changeMetadata({
                actor: ACTOR_ID,
                reason: "rename",
                patch: { name: "New" },
            });

            expect(group.name).toBe("New");
            expect(patch).toEqual({ name: { old: "Old", new: "New" } });
            expect(group.updatedAt).toBeInstanceOf(Date);
            expect(group.lastActions.update).toMatchObject({
                by: { id: ACTOR_ID },
                reason: "rename",
            });
        });

        it("should update multiple fields at once", () => {
            const group = createGroup({ name: "Old", maxAllowed: 1 });

            const patch = group.changeMetadata({
                actor: ACTOR_ID,
                reason: "bulk",
                patch: { name: "New", maxAllowed: 3 },
            });

            expect(group.name).toBe("New");
            expect(group.maxAllowed).toBe(3);
            expect(Object.keys(patch)).toHaveLength(2);
        });

        it("should skip unchanged fields", () => {
            const group = createGroup({ name: "Same", maxAllowed: 1 });

            const patch = group.changeMetadata({
                actor: ACTOR_ID,
                reason: "partial",
                patch: { name: "Same", maxAllowed: 5 },
            });

            expect(patch).not.toHaveProperty("name");
            expect(patch).toHaveProperty("maxAllowed");
        });

        it("should ignore undefined values in patch", () => {
            const group = createGroup({ maxAllowed: 1 });

            const patch = group.changeMetadata({
                actor: ACTOR_ID,
                reason: "with undefined",
                patch: { maxAllowed: 2, description: undefined },
            });

            expect(patch).toHaveProperty("maxAllowed");
            expect(patch).not.toHaveProperty("description");
        });

        it("should throw when patch is empty object", () => {
            const group = createGroup();

            expect(() =>
                group.changeMetadata({
                    actor: ACTOR_ID,
                    reason: "empty",
                    patch: {} as Entities.RoleConflictGroup.MutableFields,
                }),
            ).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const group = createGroup({ name: "Same" });

            expect(() =>
                group.changeMetadata({
                    actor: ACTOR_ID,
                    reason: "noop",
                    patch: { name: "Same" },
                }),
            ).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active group", () => {
            const group = createGroup();
            group.revoke({ actor: ACTOR_ID, reason: "cleanup" });

            expect(group.isRevoked).toBe(true);
            expect(group.updatedAt).toBeInstanceOf(Date);
            expect(group.lastActions.revoke).toMatchObject({ by: { id: ACTOR_ID }, reason: "cleanup" });
        });

        it("should throw when already revoked", () => {
            const group = createGroup();
            group.revoke({ actor: ACTOR_ID, reason: "first" });

            expect(() => group.revoke({ actor: ACTOR_ID, reason: "second" })).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked group", () => {
            const group = createGroup();
            group.revoke({ actor: ACTOR_ID, reason: "temp" });
            group.restore({ actor: ACTOR_ID, reason: "re-enable" });

            expect(group.isRevoked).toBe(false);
            expect(group.updatedAt).toBeInstanceOf(Date);
            expect(group.lastActions.restore).toMatchObject({ by: { id: ACTOR_ID }, reason: "re-enable" });
        });

        it("should throw when already active", () => {
            const group = createGroup();

            expect(() => group.restore({ actor: ACTOR_ID, reason: "noop" })).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active group", () => {
            const group = createGroup();

            expect(() => group.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for revoked system-managed group", () => {
            const group = createGroup({ isSystemManaged: true });
            group.revoke({ actor: ACTOR_ID, reason: "purge" });

            expect(() => group.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for revoked non-system group", () => {
            const group = createGroup();
            group.revoke({ actor: ACTOR_ID, reason: "purge" });

            expect(() => group.canPurge()).not.toThrow();
        });
    });
});
