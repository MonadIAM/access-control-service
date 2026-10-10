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

describe("[Entity] - Realm", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange

            // Act
            const realm = new Realm({
                owner: OWNER_ID,
                code: "TENANT_A",
                name: "Tenant A",
            });

            // Assert
            expect(realm.code).toBe("TENANT_A");
            expect(realm.name).toBe("Tenant A");
            expect(realm.owner).toBe(OWNER_ID);
        });

        it("[case] - defaults booleans to false", () => {
            // Arrange

            // Act
            const realm = createRealm();

            // Assert
            expect(realm.isSystemManaged).toBe(false);
            expect(realm.isRevoked).toBe(false);
        });

        it("[case] - respects explicit boolean overrides", () => {
            // Arrange

            // Act
            const realm = createRealm({ isSystemManaged: true, isRevoked: true });

            // Assert
            expect(realm.isSystemManaged).toBe(true);
            expect(realm.isRevoked).toBe(true);
        });

        it("[case] - generates id, createdAt, version", () => {
            // Arrange

            // Act
            const realm = createRealm();

            const result = isUUID(realm.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(realm.createdAt).toBeInstanceOf(Date);
            expect(realm.version).toBe(1);
            expect(realm.updatedAt).toBeUndefined();
        });

        it("[case] - assigns description when provided", () => {
            // Arrange

            // Act
            const realm = createRealm({ description: "Primary realm" });

            // Assert
            expect(realm.description).toBe("Primary realm");
        });

        it("[case] - leaves description undefined when omitted", () => {
            // Arrange

            // Act
            const realm = createRealm();

            // Assert
            expect(realm.description).toBeUndefined();
        });
    });

    describe("[Method] - update", () => {
        it("[case] - updates a single field", () => {
            // Arrange
            const realm = createRealm({ name: "Old" });

            // Act
            realm.update({ patch: { name: "New" } });

            // Assert
            expect(realm.name).toBe("New");
            expect(realm.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - updates multiple fields at once", () => {
            // Arrange
            const realm = createRealm({ name: "Old", description: "Old desc" });

            // Act
            realm.update({ patch: { name: "New", description: "New desc" } });

            // Assert
            expect(realm.name).toBe("New");
            expect(realm.description).toBe("New desc");
        });

        it("[case] - skips unchanged fields", () => {
            // Arrange
            const realm = createRealm({ name: "Same", description: "Old" });

            // Act
            realm.update({ patch: { name: "Same", description: "New" } });

            // Assert
            expect(realm.name).toBe("Same");
            expect(realm.description).toBe("New");
        });

        it("[case] - ignores undefined values in patch", () => {
            // Arrange
            const realm = createRealm({ name: "Original" });

            // Act
            realm.update({ patch: { name: "Updated", description: undefined } });

            // Assert
            expect(realm.name).toBe("Updated");
            expect(realm.description).toBeUndefined();
        });

        it("[case] - throws when patch is empty object", () => {
            // Arrange
            const realm = createRealm();

            // Act
            const act = (): unknown => realm.update({ patch: {} });

            // Assert
            expect(act).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("[case] - throws when no values actually changed", () => {
            // Arrange
            const realm = createRealm({ name: "Same" });

            // Act
            const act = (): unknown => realm.update({ patch: { name: "Same" } });

            // Assert
            expect(act).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - revokes an active realm", () => {
            // Arrange
            const realm = createRealm();

            // Act
            realm.revoke();

            // Assert
            expect(realm.isRevoked).toBe(true);
            expect(realm.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already revoked", () => {
            // Arrange
            const realm = createRealm();
            realm.revoke();

            // Act
            const act = (): unknown => realm.revoke();

            // Assert
            expect(act).toThrow("ALREADY_REVOKED");
        });
    });

    describe("[Method] - restore", () => {
        it("[case] - restores a revoked realm", () => {
            // Arrange
            const realm = createRealm();
            realm.revoke();

            // Act
            realm.restore();

            // Assert
            expect(realm.isRevoked).toBe(false);
            expect(realm.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already active", () => {
            // Arrange
            const realm = createRealm();

            // Act
            const act = (): unknown => realm.restore();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("[Method] - canPurge", () => {
        it("[case] - throws for active realm", () => {
            // Arrange
            const realm = createRealm();

            // Act
            const act = (): unknown => realm.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("[case] - throws for revoked system-managed realm", () => {
            // Arrange
            const realm = createRealm({ isSystemManaged: true });
            realm.revoke();

            // Act
            const act = (): unknown => realm.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("[case] - passes for revoked non-system realm", () => {
            // Arrange
            const realm = createRealm();
            realm.revoke();

            // Act
            const act = (): unknown => realm.canPurge();

            // Assert
            expect(act).not.toThrow();
        });
    });

    describe("[Behavior] - system transitions", () => {
        it("[case] - rejects restore of an active realm", () => {
            // Arrange
            const realm = createRealm();

            // Act
            const act = (): unknown => realm.restoreBySystem();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVE");
            expect(realm.isRevoked).toBe(false);
        });

        it("[case] - rejects a repeated system revoke", () => {
            // Arrange
            const realm = createRealm();
            realm.revokeBySystem();

            // Act
            const act = (): unknown => realm.revokeBySystem();

            // Assert
            expect(act).toThrow("ALREADY_REVOKED");
            expect(realm.isSystemRevoked).toBe(true);
        });

        it("[case] - preserves a manual revoke during system restore", () => {
            // Arrange
            const realm = createRealm();
            realm.revoke();

            // Act
            realm.restoreBySystem();

            // Assert
            expect(realm.isRevoked).toBe(true);
            expect(realm.isSystemRevoked).toBe(false);
        });
    });
});
