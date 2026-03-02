import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { RoleActorType, RoleProtoType } from "~context/enums";

import { Role } from "./role.entity";
import { Realm } from "./realm.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000000";

function createRealm(): Realm {
    return {} as Realm;
}

function createRole(overrides?: Partial<Entities.Role.ConstructorProps>): Role {
    return new Role({
        code: "test.administrator",
        name: "Administrator",
        actorType: RoleActorType.HUMAN,
        protoType: RoleProtoType.ATOMIC,
        realm: createRealm(),
        actor: ACTOR_ID,
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
                protoType: RoleProtoType.ATOMIC,
                actor: ACTOR_ID,
                realm,
            });

            expect(role.code).toBe("test.moderator");
            expect(role.name).toBe("Moderator");
            expect(role.actorType).toBe(RoleActorType.HUMAN);
            expect(role.protoType).toBe(RoleProtoType.ATOMIC);
            expect(role.realm).toBe(realm);
        });

        it("should default isSystemManaged, nonDelegable, isRevoked to false", () => {
            const role = createRole();

            expect(role.isSystemManaged).toBe(false);
            expect(role.nonDelegable).toBe(false);
            expect(role.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const role = createRole({
                isSystemManaged: true,
                nonDelegable: true,
                isRevoked: true,
            });

            expect(role.isSystemManaged).toBe(true);
            expect(role.nonDelegable).toBe(true);
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

        it("should populate lastActions.create with actor id", () => {
            const role = createRole();

            expect(role.lastActions).toEqual({
                create: { by: { id: ACTOR_ID } },
            });
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

    describe("changeMetadata", () => {
        it("should update a single field and return history patch", () => {
            const role = createRole({ name: "Old Name" });

            const patch = role.changeMetadata({
                actor: ACTOR_ID,
                reason: "rename",
                patch: { name: "New Name" },
            });

            expect(role.name).toBe("New Name");
            expect(patch).toEqual({ name: { old: "Old Name", new: "New Name" } });
            expect(role.updatedAt).toBeInstanceOf(Date);
            expect(role.lastActions.update).toMatchObject({
                by: { id: ACTOR_ID },
                reason: "rename",
                patch: { name: { old: "Old Name", new: "New Name" } },
            });
        });

        it("should update multiple fields at once", () => {
            const role = createRole({ name: "Old", description: "Old desc" });

            const patch = role.changeMetadata({
                actor: ACTOR_ID,
                reason: "bulk update",
                patch: { name: "New", description: "New desc" },
            });

            expect(role.name).toBe("New");
            expect(role.description).toBe("New desc");
            expect(Object.keys(patch)).toHaveLength(2);
            expect(patch).toHaveProperty("name");
            expect(patch).toHaveProperty("description");
        });

        it("should skip fields whose value matches the current one", () => {
            const role = createRole({ name: "Same", description: "Changed old" });

            const patch = role.changeMetadata({
                actor: ACTOR_ID,
                reason: "partial",
                patch: { name: "Same", description: "Changed new" },
            });

            expect(patch).not.toHaveProperty("name");
            expect(patch).toHaveProperty("description");
        });

        it("should ignore undefined values in patch", () => {
            const role = createRole({ name: "Original" });

            const patch = role.changeMetadata({
                actor: ACTOR_ID,
                reason: "with undefined",
                patch: { name: "Updated", description: undefined },
            });

            expect(patch).toHaveProperty("name");
            expect(patch).not.toHaveProperty("description");
        });

        it("should throw EMPTY_UPDATE_PATCH when patch object is empty", () => {
            const role = createRole();

            expect(() =>
                role.changeMetadata({
                    actor: ACTOR_ID,
                    reason: "empty",
                    patch: {} as Entities.Role.MutableFields,
                }),
            ).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw NO_CHANGES_DETECTED when all values match current state", () => {
            const role = createRole({ name: "Same" });

            expect(() =>
                role.changeMetadata({
                    actor: ACTOR_ID,
                    reason: "no-op",
                    patch: { name: "Same" },
                }),
            ).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active role", () => {
            const role = createRole();

            role.revoke({ actor: ACTOR_ID, reason: "deprecated" });

            expect(role.isRevoked).toBe(true);
            expect(role.updatedAt).toBeInstanceOf(Date);
            expect(role.lastActions.revoke).toMatchObject({
                by: { id: ACTOR_ID },
                reason: "deprecated",
            });
        });

        it("should throw ALREADY_REVOKED when revoking twice", () => {
            const role = createRole();
            role.revoke({ actor: ACTOR_ID, reason: "first" });

            expect(() => role.revoke({ actor: ACTOR_ID, reason: "second" })).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked role", () => {
            const role = createRole();
            role.revoke({ actor: ACTOR_ID, reason: "temp" });

            role.restore({ actor: ACTOR_ID, reason: "re-enabled" });

            expect(role.isRevoked).toBe(false);
            expect(role.updatedAt).toBeInstanceOf(Date);
            expect(role.lastActions.restore).toMatchObject({
                by: { id: ACTOR_ID },
                reason: "re-enabled",
            });
        });

        it("should throw ALREADY_ACTIVE when restoring an active role", () => {
            const role = createRole();

            expect(() => role.restore({ actor: ACTOR_ID, reason: "noop" })).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw CANNOT_PURGE_ACTIVE for a non-revoked role", () => {
            const role = createRole();

            expect(() => role.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw CANNOT_PURGE_SYSTEM for a revoked system-managed role", () => {
            const role = createRole({ isSystemManaged: true });
            role.revoke({ actor: ACTOR_ID, reason: "try purge" });

            expect(() => role.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for a revoked non-system role", () => {
            const role = createRole();
            role.revoke({ actor: ACTOR_ID, reason: "purge ready" });

            expect(() => role.canPurge()).not.toThrow();
        });
    });
});
