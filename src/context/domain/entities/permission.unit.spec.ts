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

describe("[Entity] - Permission", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange

            // Act
            const permission = createPermission({
                code: "WRITE_USERS",
                name: "Write Users",
            });

            // Assert
            expect(permission.code).toBe("WRITE_USERS");
            expect(permission.name).toBe("Write Users");
        });

        it("[case] - defaults booleans to false", () => {
            // Arrange

            // Act
            const permission = createPermission();

            // Assert
            expect(permission.isSystemManaged).toBe(false);
            expect(permission.isRevoked).toBe(false);
        });

        it("[case] - respects explicit boolean overrides", () => {
            // Arrange

            // Act
            const permission = createPermission({ isSystemManaged: true, isRevoked: true });

            // Assert
            expect(permission.isSystemManaged).toBe(true);
            expect(permission.isRevoked).toBe(true);
        });

        it("[case] - generates id, createdAt, version", () => {
            // Arrange

            // Act
            const permission = createPermission();

            const result = isUUID(permission.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(permission.createdAt).toBeInstanceOf(Date);
            expect(permission.version).toBe(1);
            expect(permission.updatedAt).toBeUndefined();
        });

        it("[case] - assigns description when provided", () => {
            // Arrange

            // Act
            const permission = createPermission({ description: "Allows reading users" });

            // Assert
            expect(permission.description).toBe("Allows reading users");
        });

        it("[case] - leaves description undefined when omitted", () => {
            // Arrange

            // Act
            const permission = createPermission();

            // Assert
            expect(permission.description).toBeUndefined();
        });

        it("[case] - assigns realm", () => {
            // Arrange
            const realm = {} as Realm;

            // Act
            const permission = createPermission({ realm });

            // Assert
            expect(permission.realm).toBe(realm);
        });
    });

    describe("[Method] - update", () => {
        it("[case] - updates a single field", () => {
            // Arrange
            const permission = createPermission({ name: "Old" });

            // Act
            permission.update({ patch: { name: "New" } });

            // Assert
            expect(permission.name).toBe("New");
            expect(permission.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - updates multiple fields at once", () => {
            // Arrange
            const permission = createPermission({ name: "Old", description: "Old desc" });

            // Act
            permission.update({ patch: { name: "New", description: "New desc" } });

            // Assert
            expect(permission.name).toBe("New");
            expect(permission.description).toBe("New desc");
        });

        it("[case] - skips unchanged fields", () => {
            // Arrange
            const permission = createPermission({ name: "Same", description: "Old" });

            // Act
            permission.update({ patch: { name: "Same", description: "New" } });

            // Assert
            expect(permission.name).toBe("Same");
            expect(permission.description).toBe("New");
        });

        it("[case] - ignores undefined values in patch", () => {
            // Arrange
            const permission = createPermission({ name: "Original" });

            // Act
            permission.update({ patch: { name: "Updated", description: undefined } });

            // Assert
            expect(permission.name).toBe("Updated");
            expect(permission.description).toBeUndefined();
        });

        it("[case] - throws when patch is empty object", () => {
            // Arrange
            const permission = createPermission();

            // Act
            const act = (): unknown => permission.update({ patch: {} });

            // Assert
            expect(act).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("[case] - throws when no values actually changed", () => {
            // Arrange
            const permission = createPermission({ name: "Same" });

            // Act
            const act = (): unknown => permission.update({ patch: { name: "Same" } });

            // Assert
            expect(act).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - revokes an active permission", () => {
            // Arrange
            const permission = createPermission();

            // Act
            permission.revoke();

            // Assert
            expect(permission.isRevoked).toBe(true);
            expect(permission.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already revoked", () => {
            // Arrange
            const permission = createPermission();
            permission.revoke();

            // Act
            const act = (): unknown => permission.revoke();

            // Assert
            expect(act).toThrow("ALREADY_REVOKED");
        });
    });

    describe("[Method] - restore", () => {
        it("[case] - restores a revoked permission", () => {
            // Arrange
            const permission = createPermission();
            permission.revoke();

            // Act
            permission.restore();

            // Assert
            expect(permission.isRevoked).toBe(false);
            expect(permission.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already active", () => {
            // Arrange
            const permission = createPermission();

            // Act
            const act = (): unknown => permission.restore();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("[Method] - canPurge", () => {
        it("[case] - throws for active permission", () => {
            // Arrange
            const permission = createPermission();

            // Act
            const act = (): unknown => permission.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("[case] - throws for revoked system-managed permission", () => {
            // Arrange
            const permission = createPermission({ isSystemManaged: true });
            permission.revoke();

            // Act
            const act = (): unknown => permission.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("[case] - passes for revoked non-system permission", () => {
            // Arrange
            const permission = createPermission();
            permission.revoke();

            // Act
            const act = (): unknown => permission.canPurge();

            // Assert
            expect(act).not.toThrow();
        });
    });
});
