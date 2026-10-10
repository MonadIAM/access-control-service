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

describe("[Entity] - Role", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns all required fields", () => {
            // Arrange
            const realm = createRealm();

            // Act
            const role = new Role({
                code: "test.moderator",
                name: "Moderator",
                actorType: RoleActorType.HUMAN,
                archetype: RoleArchetype.ATOMIC,
                realm,
            });

            // Assert
            expect(role.code).toBe("test.moderator");
            expect(role.name).toBe("Moderator");
            expect(role.actorType).toBe(RoleActorType.HUMAN);
            expect(role.archetype).toBe(RoleArchetype.ATOMIC);
            expect(role.realm).toBe(realm);
        });

        it("[case] - defaults isSystemManaged and isRevoked to false", () => {
            // Arrange

            // Act
            const role = createRole();

            // Assert
            expect(role.isSystemManaged).toBe(false);
            expect(role.isRevoked).toBe(false);
        });

        it("[case] - respects explicit boolean overrides", () => {
            // Arrange

            // Act
            const role = createRole({
                isSystemManaged: true,
                isRevoked: true,
            });

            // Assert
            expect(role.isSystemManaged).toBe(true);
            expect(role.isRevoked).toBe(true);
        });

        it("[case] - generates id (uuid v4), createdAt, version", () => {
            // Arrange
            const before = new Date();

            // Act
            const role = createRole();

            const result = isUUID(role.id, "4");
            const result2 = role.createdAt.getTime();

            // Assert
            expect(result).toBe(true);
            expect(role.createdAt).toBeInstanceOf(Date);
            expect(result2).toBeGreaterThanOrEqual(before.getTime());
            expect(role.updatedAt).toBeUndefined();
            expect(role.version).toBe(1);
        });

        it("[case] - assigns description when provided", () => {
            // Arrange

            // Act
            const role = createRole({ description: "Full access role" });

            // Assert
            expect(role.description).toBe("Full access role");
        });

        it("[case] - leaves description undefined when omitted", () => {
            // Arrange

            // Act
            const role = createRole();

            // Assert
            expect(role.description).toBeUndefined();
        });
    });

    describe("[Method] - update", () => {
        it("[case] - updates a single field", () => {
            // Arrange
            const role = createRole({ name: "Old Name" });

            // Act
            role.update({ patch: { name: "New Name" } });

            // Assert
            expect(role.name).toBe("New Name");
            expect(role.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - updates multiple fields at once", () => {
            // Arrange
            const role = createRole({ name: "Old", description: "Old desc" });

            // Act
            role.update({ patch: { name: "New", description: "New desc" } });

            // Assert
            expect(role.name).toBe("New");
            expect(role.description).toBe("New desc");
        });

        it("[case] - skips fields whose value matches the current one", () => {
            // Arrange
            const role = createRole({ name: "Same", description: "Changed old" });

            // Act
            role.update({ patch: { name: "Same", description: "Changed new" } });

            // Assert
            expect(role.name).toBe("Same");
            expect(role.description).toBe("Changed new");
        });

        it("[case] - ignores undefined values in patch", () => {
            // Arrange
            const role = createRole({ name: "Original" });

            // Act
            role.update({ patch: { name: "Updated", description: undefined } });

            // Assert
            expect(role.name).toBe("Updated");
            expect(role.description).toBeUndefined();
        });

        it("[case] - throws EMPTY_UPDATE_PATCH when patch object is empty", () => {
            // Arrange
            const role = createRole();

            // Act
            const act = (): unknown => role.update({ patch: {} });

            // Assert
            expect(act).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("[case] - throws NO_CHANGES_DETECTED when all values match current state", () => {
            // Arrange
            const role = createRole({ name: "Same" });

            // Act
            const act = (): unknown => role.update({ patch: { name: "Same" } });

            // Assert
            expect(act).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - revokes an active role", () => {
            // Arrange
            const role = createRole();

            // Act
            role.revoke();

            // Assert
            expect(role.isRevoked).toBe(true);
            expect(role.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws ALREADY_REVOKED when revoking twice", () => {
            // Arrange
            const role = createRole();
            role.revoke();

            // Act
            const act = (): unknown => role.revoke();

            // Assert
            expect(act).toThrow("ALREADY_REVOKED");
        });
    });

    describe("[Method] - restore", () => {
        it("[case] - restores a revoked role", () => {
            // Arrange
            const role = createRole();
            role.revoke();

            // Act
            role.restore();

            // Assert
            expect(role.isRevoked).toBe(false);
            expect(role.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws ALREADY_ACTIVE when restoring an active role", () => {
            // Arrange
            const role = createRole();

            // Act
            const act = (): unknown => role.restore();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("[Method] - canPurge", () => {
        it("[case] - throws CANNOT_PURGE_ACTIVE for a non-revoked role", () => {
            // Arrange
            const role = createRole();

            // Act
            const act = (): unknown => role.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("[case] - throws CANNOT_PURGE_SYSTEM for a revoked system-managed role", () => {
            // Arrange
            const role = createRole({ isSystemManaged: true });
            role.revoke();

            // Act
            const act = (): unknown => role.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("[case] - passes for a revoked non-system role", () => {
            // Arrange
            const role = createRole();
            role.revoke();

            // Act
            const act = (): unknown => role.canPurge();

            // Assert
            expect(act).not.toThrow();
        });
    });
});
