import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { Realm } from "./realm.entity";

const OWNER_ID = "00000000-0000-4000-8000-000000000001";

function createRealm(overrides?: Partial<Entities.Realm.ConstructorProps>): Realm {
    return new Realm({
        owner: OWNER_ID,
        code: "MAIN",
        name: "Main Realm",
        ...overrides,
    });
}

describe("Realm Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const realm = new Realm({
                owner: OWNER_ID,
                code: "TENANT_A",
                name: "Tenant A",
            });

            expect(realm.code).toBe("TENANT_A");
            expect(realm.name).toBe("Tenant A");
            expect(realm.owner).toBe(OWNER_ID);
        });

        it("should default booleans to false", () => {
            const realm = createRealm();

            expect(realm.isSystemManaged).toBe(false);
            expect(realm.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const realm = createRealm({ isSystemManaged: true, isRevoked: true });

            expect(realm.isSystemManaged).toBe(true);
            expect(realm.isRevoked).toBe(true);
        });

        it("should auto-generate id, createdAt, version", () => {
            const realm = createRealm();

            expect(isUUID(realm.id, "4")).toBe(true);
            expect(realm.createdAt).toBeInstanceOf(Date);
            expect(realm.version).toBe(1);
            expect(realm.updatedAt).toBeUndefined();
        });

        it("should assign description when provided", () => {
            const realm = createRealm({ description: "Primary realm" });
            expect(realm.description).toBe("Primary realm");
        });

        it("should leave description undefined when omitted", () => {
            const realm = createRealm();
            expect(realm.description).toBeUndefined();
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const realm = createRealm({ name: "Old" });

            realm.update({ patch: { name: "New" } });

            expect(realm.name).toBe("New");
            expect(realm.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const realm = createRealm({ name: "Old", description: "Old desc" });

            realm.update({ patch: { name: "New", description: "New desc" } });

            expect(realm.name).toBe("New");
            expect(realm.description).toBe("New desc");
        });

        it("should skip unchanged fields", () => {
            const realm = createRealm({ name: "Same", description: "Old" });

            realm.update({ patch: { name: "Same", description: "New" } });

            expect(realm.name).toBe("Same");
            expect(realm.description).toBe("New");
        });

        it("should ignore undefined values in patch", () => {
            const realm = createRealm({ name: "Original" });

            realm.update({ patch: { name: "Updated", description: undefined } });

            expect(realm.name).toBe("Updated");
            expect(realm.description).toBeUndefined();
        });

        it("should throw when patch is empty object", () => {
            const realm = createRealm();

            expect(() => realm.update({ patch: {} })).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const realm = createRealm({ name: "Same" });

            expect(() => realm.update({ patch: { name: "Same" } })).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active realm", () => {
            const realm = createRealm();
            realm.revoke();

            expect(realm.isRevoked).toBe(true);
            expect(realm.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const realm = createRealm();
            realm.revoke();

            expect(() => realm.revoke()).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked realm", () => {
            const realm = createRealm();
            realm.revoke();
            realm.restore();

            expect(realm.isRevoked).toBe(false);
            expect(realm.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already active", () => {
            const realm = createRealm();

            expect(() => realm.restore()).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active realm", () => {
            const realm = createRealm();

            expect(() => realm.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for revoked system-managed realm", () => {
            const realm = createRealm({ isSystemManaged: true });
            realm.revoke();

            expect(() => realm.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for revoked non-system realm", () => {
            const realm = createRealm();
            realm.revoke();

            expect(() => realm.canPurge()).not.toThrow();
        });
    });
});
