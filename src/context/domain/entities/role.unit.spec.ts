import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { RoleActorType, RoleArchetype } from "~context/enums";

import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

function createRealm(): Realm {
    return {} as Realm;
}

function createRole(overrides?: Partial<Entities.Role.ConstructorProps>): Role {
    return new Role({
        code: "test.administrator",
        name: "Administrator",
        actorType: RoleActorType.HUMAN,
        archetype: RoleArchetype.ATOMIC,
        realm: createRealm(),
        ...overrides,
    });
}

describe("Role Entity", () => {
    describe("constructor", () => {
        it("should assign all required fields", () => {
            const realm = createRealm();
            const role = new Role({
                code: "test.moderator",
                name: "Moderator",
                actorType: RoleActorType.HUMAN,
                archetype: RoleArchetype.ATOMIC,
                realm,
            });

            expect(role.code).toBe("test.moderator");
            expect(role.name).toBe("Moderator");
            expect(role.actorType).toBe(RoleActorType.HUMAN);
            expect(role.archetype).toBe(RoleArchetype.ATOMIC);
            expect(role.realm).toBe(realm);
        });

        it("should default isSystemManaged and isRevoked to false", () => {
            const role = createRole();

            expect(role.isSystemManaged).toBe(false);
            expect(role.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const role = createRole({
                isSystemManaged: true,
                isRevoked: true,
            });

            expect(role.isSystemManaged).toBe(true);
            expect(role.isRevoked).toBe(true);
        });

        it("should auto-generate id (uuid v4), createdAt, version", () => {
            const before = new Date();
            const role = createRole();

            expect(isUUID(role.id, "4")).toBe(true);
            expect(role.createdAt).toBeInstanceOf(Date);
            expect(role.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(role.updatedAt).toBeUndefined();
            expect(role.version).toBe(1);
        });

        it("should assign description when provided", () => {
            const role = createRole({ description: "Full access role" });
            expect(role.description).toBe("Full access role");
        });

        it("should leave description undefined when omitted", () => {
            const role = createRole();
            expect(role.description).toBeUndefined();
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const role = createRole({ name: "Old Name" });

            role.update({ patch: { name: "New Name" } });

            expect(role.name).toBe("New Name");
            expect(role.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const role = createRole({ name: "Old", description: "Old desc" });

            role.update({ patch: { name: "New", description: "New desc" } });

            expect(role.name).toBe("New");
            expect(role.description).toBe("New desc");
        });

        it("should skip fields whose value matches the current one", () => {
            const role = createRole({ name: "Same", description: "Changed old" });

            role.update({ patch: { name: "Same", description: "Changed new" } });

            expect(role.name).toBe("Same");
            expect(role.description).toBe("Changed new");
        });

        it("should ignore undefined values in patch", () => {
            const role = createRole({ name: "Original" });

            role.update({ patch: { name: "Updated", description: undefined } });

            expect(role.name).toBe("Updated");
            expect(role.description).toBeUndefined();
        });

        it("should throw EMPTY_UPDATE_PATCH when patch object is empty", () => {
            const role = createRole();

            expect(() => role.update({ patch: {} })).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw NO_CHANGES_DETECTED when all values match current state", () => {
            const role = createRole({ name: "Same" });

            expect(() => role.update({ patch: { name: "Same" } })).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active role", () => {
            const role = createRole();

            role.revoke();

            expect(role.isRevoked).toBe(true);
            expect(role.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw ALREADY_REVOKED when revoking twice", () => {
            const role = createRole();
            role.revoke();

            expect(() => role.revoke()).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked role", () => {
            const role = createRole();
            role.revoke();

            role.restore();

            expect(role.isRevoked).toBe(false);
            expect(role.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw ALREADY_ACTIVE when restoring an active role", () => {
            const role = createRole();

            expect(() => role.restore()).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw CANNOT_PURGE_ACTIVE for a non-revoked role", () => {
            const role = createRole();

            expect(() => role.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw CANNOT_PURGE_SYSTEM for a revoked system-managed role", () => {
            const role = createRole({ isSystemManaged: true });
            role.revoke();

            expect(() => role.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for a revoked non-system role", () => {
            const role = createRole();
            role.revoke();

            expect(() => role.canPurge()).not.toThrow();
        });
    });
});
