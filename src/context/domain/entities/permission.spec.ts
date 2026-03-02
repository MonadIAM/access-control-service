import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000000";

function createPermission(overrides?: Partial<Entities.Permission.ConstructorProps>): Permission {
    return new Permission({
        actor: ACTOR_ID,
        code: "READ_USERS",
        name: "Read Users",
        realm: {} as Realm,
        ...overrides,
    });
}

describe("Permission Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const permission = createPermission({
                actor: ACTOR_ID,
                code: "WRITE_USERS",
                name: "Write Users",
            });

            expect(permission.code).toBe("WRITE_USERS");
            expect(permission.name).toBe("Write Users");
        });

        it("should default booleans to false", () => {
            const permission = createPermission();

            expect(permission.isSystemManaged).toBe(false);
            expect(permission.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const permission = createPermission({ isSystemManaged: true, isRevoked: true });

            expect(permission.isSystemManaged).toBe(true);
            expect(permission.isRevoked).toBe(true);
        });

        it("should auto-generate id, createdAt, version", () => {
            const permission = createPermission();

            expect(isUUID(permission.id, "4")).toBe(true);
            expect(permission.createdAt).toBeInstanceOf(Date);
            expect(permission.version).toBe(1);
            expect(permission.updatedAt).toBeUndefined();
        });

        it("should populate lastActions.create", () => {
            const permission = createPermission();

            expect(permission.lastActions).toEqual({ create: { by: { id: ACTOR_ID } } });
        });

        it("should assign description when provided", () => {
            const permission = createPermission({ description: "Allows reading users" });
            expect(permission.description).toBe("Allows reading users");
        });

        it("should leave description undefined when omitted", () => {
            const permission = createPermission();
            expect(permission.description).toBeUndefined();
        });

        it("should assign realm when provided", () => {
            const realm = {} as Realm;
            const permission = createPermission({ realm });

            expect(permission.realm).toBe(realm);
        });
    });

    describe("changeMetadata", () => {
        it("should update a single field and return patch", () => {
            const permission = createPermission({ name: "Old" });

            const patch = permission.changeMetadata({
                actor: ACTOR_ID,
                reason: "rename",
                patch: { name: "New" },
            });

            expect(permission.name).toBe("New");
            expect(patch).toEqual({ name: { old: "Old", new: "New" } });
            expect(permission.updatedAt).toBeInstanceOf(Date);
            expect(permission.lastActions.update).toMatchObject({
                by: { id: ACTOR_ID },
                reason: "rename",
            });
        });

        it("should update multiple fields at once", () => {
            const permission = createPermission({ name: "Old", description: "Old desc" });

            const patch = permission.changeMetadata({
                actor: ACTOR_ID,
                reason: "bulk",
                patch: { name: "New", description: "New desc" },
            });

            expect(permission.name).toBe("New");
            expect(permission.description).toBe("New desc");
            expect(Object.keys(patch)).toHaveLength(2);
        });

        it("should skip unchanged fields", () => {
            const permission = createPermission({ name: "Same", description: "Old" });

            const patch = permission.changeMetadata({
                actor: ACTOR_ID,
                reason: "partial",
                patch: { name: "Same", description: "New" },
            });

            expect(patch).not.toHaveProperty("name");
            expect(patch).toHaveProperty("description");
        });

        it("should ignore undefined values in patch", () => {
            const permission = createPermission({ name: "Original" });

            const patch = permission.changeMetadata({
                actor: ACTOR_ID,
                reason: "with undefined",
                patch: { name: "Updated", description: undefined },
            });

            expect(patch).toHaveProperty("name");
            expect(patch).not.toHaveProperty("description");
        });

        it("should throw when patch is empty object", () => {
            const permission = createPermission();

            expect(() =>
                permission.changeMetadata({
                    actor: ACTOR_ID,
                    reason: "empty",
                    patch: {} as Entities.Permission.MutableFields,
                }),
            ).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const permission = createPermission({ name: "Same" });

            expect(() =>
                permission.changeMetadata({
                    actor: ACTOR_ID,
                    reason: "noop",
                    patch: { name: "Same" },
                }),
            ).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active permission", () => {
            const permission = createPermission();
            permission.revoke({ actor: ACTOR_ID, reason: "deprecated" });

            expect(permission.isRevoked).toBe(true);
            expect(permission.updatedAt).toBeInstanceOf(Date);
            expect(permission.lastActions.revoke).toMatchObject({ by: { id: ACTOR_ID }, reason: "deprecated" });
        });

        it("should throw when already revoked", () => {
            const permission = createPermission();
            permission.revoke({ actor: ACTOR_ID, reason: "first" });

            expect(() => permission.revoke({ actor: ACTOR_ID, reason: "second" })).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked permission", () => {
            const permission = createPermission();
            permission.revoke({ actor: ACTOR_ID, reason: "temp" });
            permission.restore({ actor: ACTOR_ID, reason: "re-enable" });

            expect(permission.isRevoked).toBe(false);
            expect(permission.updatedAt).toBeInstanceOf(Date);
            expect(permission.lastActions.restore).toMatchObject({ by: { id: ACTOR_ID }, reason: "re-enable" });
        });

        it("should throw when already active", () => {
            const permission = createPermission();

            expect(() => permission.restore({ actor: ACTOR_ID, reason: "noop" })).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active permission", () => {
            const permission = createPermission();

            expect(() => permission.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for revoked system-managed permission", () => {
            const permission = createPermission({ isSystemManaged: true });
            permission.revoke({ actor: ACTOR_ID, reason: "purge" });

            expect(() => permission.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for revoked non-system permission", () => {
            const permission = createPermission();
            permission.revoke({ actor: ACTOR_ID, reason: "purge" });

            expect(() => permission.canPurge()).not.toThrow();
        });
    });
});
