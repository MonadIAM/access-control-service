import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { Realm } from "./realm.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000000";

function createRealm(overrides?: Partial<Entities.Realm.ConstructorProps>): Realm {
    return new Realm({
        actor: ACTOR_ID,
        code: "MAIN",
        name: "Main Realm",
        ...overrides,
    });
}

describe("Realm Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const realm = new Realm({
                actor: ACTOR_ID,
                code: "TENANT_A",
                name: "Tenant A",
            });

            expect(realm.code).toBe("TENANT_A");
            expect(realm.name).toBe("Tenant A");
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

        it("should populate lastActions.create", () => {
            const realm = createRealm();

            expect(realm.lastActions).toEqual({ create: { by: { id: ACTOR_ID } } });
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

    describe("changeMetadata", () => {
        it("should update a single field and return patch", () => {
            const realm = createRealm({ name: "Old" });

            const patch = realm.changeMetadata({
                actor: ACTOR_ID,
                reason: "rename",
                patch: { name: "New" },
            });

            expect(realm.name).toBe("New");
            expect(patch).toEqual({ name: { old: "Old", new: "New" } });
            expect(realm.updatedAt).toBeInstanceOf(Date);
            expect(realm.lastActions.update).toMatchObject({
                by: { id: ACTOR_ID },
                reason: "rename",
            });
        });

        it("should update multiple fields at once", () => {
            const realm = createRealm({ name: "Old", description: "Old desc" });

            const patch = realm.changeMetadata({
                actor: ACTOR_ID,
                reason: "bulk",
                patch: { name: "New", description: "New desc" },
            });

            expect(realm.name).toBe("New");
            expect(realm.description).toBe("New desc");
            expect(Object.keys(patch)).toHaveLength(2);
        });

        it("should skip unchanged fields", () => {
            const realm = createRealm({ name: "Same", description: "Old" });

            const patch = realm.changeMetadata({
                actor: ACTOR_ID,
                reason: "partial",
                patch: { name: "Same", description: "New" },
            });

            expect(patch).not.toHaveProperty("name");
            expect(patch).toHaveProperty("description");
        });

        it("should ignore undefined values in patch", () => {
            const realm = createRealm({ name: "Original" });

            const patch = realm.changeMetadata({
                actor: ACTOR_ID,
                reason: "with undefined",
                patch: { name: "Updated", description: undefined },
            });

            expect(patch).toHaveProperty("name");
            expect(patch).not.toHaveProperty("description");
        });

        it("should throw when patch is empty object", () => {
            const realm = createRealm();

            expect(() =>
                realm.changeMetadata({
                    actor: ACTOR_ID,
                    reason: "empty",
                    patch: {} as Entities.Realm.MutableFields,
                }),
            ).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const realm = createRealm({ name: "Same" });

            expect(() =>
                realm.changeMetadata({
                    actor: ACTOR_ID,
                    reason: "noop",
                    patch: { name: "Same" },
                }),
            ).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active realm", () => {
            const realm = createRealm();
            realm.revoke({ actor: ACTOR_ID, reason: "decommission" });

            expect(realm.isRevoked).toBe(true);
            expect(realm.updatedAt).toBeInstanceOf(Date);
            expect(realm.lastActions.revoke).toMatchObject({ by: { id: ACTOR_ID }, reason: "decommission" });
        });

        it("should throw when already revoked", () => {
            const realm = createRealm();
            realm.revoke({ actor: ACTOR_ID, reason: "first" });

            expect(() => realm.revoke({ actor: ACTOR_ID, reason: "second" })).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked realm", () => {
            const realm = createRealm();
            realm.revoke({ actor: ACTOR_ID, reason: "temp" });
            realm.restore({ actor: ACTOR_ID, reason: "re-enable" });

            expect(realm.isRevoked).toBe(false);
            expect(realm.updatedAt).toBeInstanceOf(Date);
            expect(realm.lastActions.restore).toMatchObject({ by: { id: ACTOR_ID }, reason: "re-enable" });
        });

        it("should throw when already active", () => {
            const realm = createRealm();

            expect(() => realm.restore({ actor: ACTOR_ID, reason: "noop" })).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active realm", () => {
            const realm = createRealm();

            expect(() => realm.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for revoked system-managed realm", () => {
            const realm = createRealm({ isSystemManaged: true });
            realm.revoke({ actor: ACTOR_ID, reason: "purge" });

            expect(() => realm.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for revoked non-system realm", () => {
            const realm = createRealm();
            realm.revoke({ actor: ACTOR_ID, reason: "purge" });

            expect(() => realm.canPurge()).not.toThrow();
        });
    });
});
