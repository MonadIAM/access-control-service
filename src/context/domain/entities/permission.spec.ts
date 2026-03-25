import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";

function createPermission(overrides?: Partial<Entities.Permission.ConstructorProps>): Permission {
    return new Permission({
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

        it("should assign description when provided", () => {
            const permission = createPermission({ description: "Allows reading users" });
            expect(permission.description).toBe("Allows reading users");
        });

        it("should leave description undefined when omitted", () => {
            const permission = createPermission();
            expect(permission.description).toBeUndefined();
        });

        it("should assign realm", () => {
            const realm = {} as Realm;
            const permission = createPermission({ realm });

            expect(permission.realm).toBe(realm);
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const permission = createPermission({ name: "Old" });

            permission.update({ patch: { name: "New" } });

            expect(permission.name).toBe("New");
            expect(permission.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const permission = createPermission({ name: "Old", description: "Old desc" });

            permission.update({ patch: { name: "New", description: "New desc" } });

            expect(permission.name).toBe("New");
            expect(permission.description).toBe("New desc");
        });

        it("should skip unchanged fields", () => {
            const permission = createPermission({ name: "Same", description: "Old" });

            permission.update({ patch: { name: "Same", description: "New" } });

            expect(permission.name).toBe("Same");
            expect(permission.description).toBe("New");
        });

        it("should ignore undefined values in patch", () => {
            const permission = createPermission({ name: "Original" });

            permission.update({ patch: { name: "Updated", description: undefined } });

            expect(permission.name).toBe("Updated");
            expect(permission.description).toBeUndefined();
        });

        it("should throw when patch is empty object", () => {
            const permission = createPermission();

            expect(() => permission.update({ patch: {} })).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const permission = createPermission({ name: "Same" });

            expect(() => permission.update({ patch: { name: "Same" } })).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active permission", () => {
            const permission = createPermission();
            permission.revoke();

            expect(permission.isRevoked).toBe(true);
            expect(permission.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const permission = createPermission();
            permission.revoke();

            expect(() => permission.revoke()).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked permission", () => {
            const permission = createPermission();
            permission.revoke();
            permission.restore();

            expect(permission.isRevoked).toBe(false);
            expect(permission.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already active", () => {
            const permission = createPermission();

            expect(() => permission.restore()).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active permission", () => {
            const permission = createPermission();

            expect(() => permission.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for revoked system-managed permission", () => {
            const permission = createPermission({ isSystemManaged: true });
            permission.revoke();

            expect(() => permission.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for revoked non-system permission", () => {
            const permission = createPermission();
            permission.revoke();

            expect(() => permission.canPurge()).not.toThrow();
        });
    });
});
