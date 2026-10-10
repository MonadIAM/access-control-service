import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { PermissionOverrideEffect } from "~context/enums";

import { PermissionOverride } from "./permission-override.entity";
import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";

function createOverride(overrides?: Partial<Entities.PermissionOverride.ConstructorProps>): PermissionOverride {
    return new PermissionOverride({
        account: ACCOUNT_ID,
        effect: PermissionOverrideEffect.ALLOW,
        permission: {} as Permission,
        realm: {} as Realm,
        ...overrides,
    });
}

describe("[Entity] - PermissionOverride", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields and relations", () => {
            // Arrange
            const permission = {} as Permission;
            const realm = {} as Realm;

            // Act
            const override = createOverride({
                account: ACCOUNT_ID,
                effect: PermissionOverrideEffect.DENY,
                permission,
                realm,
            });

            // Assert
            expect(override.account).toBe(ACCOUNT_ID);
            expect(override.effect).toBe(PermissionOverrideEffect.DENY);
            expect(override.permission).toBe(permission);
            expect(override.realm).toBe(realm);
        });

        it("[case] - assigns justification when provided", () => {
            // Arrange

            // Act
            const override = createOverride({ justification: "Temporary access for incident response" });

            // Assert
            expect(override.justification).toBe("Temporary access for incident response");
        });

        it("[case] - leaves justification undefined when not provided", () => {
            // Arrange

            // Act
            const override = createOverride();

            // Assert
            expect(override.justification).toBeUndefined();
        });

        it("[case] - defaults isRevoked to false", () => {
            // Arrange

            // Act
            const override = createOverride();

            // Assert
            expect(override.isRevoked).toBe(false);
        });

        it("[case] - respects explicit isRevoked override", () => {
            // Arrange

            // Act
            const override = createOverride({ isRevoked: true });

            // Assert
            expect(override.isRevoked).toBe(true);
        });

        it("[case] - normalizes explicit expiration to the start of the day", () => {
            // Arrange
            const expiresAt = new Date(2999, 4, 15, 13, 45, 30, 123);
            const expected = new Date(expiresAt);
            expected.setHours(0, 0, 0, 0);

            // Act
            const override = createOverride({ expiresAt });

            // Assert
            expect(override.expiresAt).toEqual(expected);
            expect(override.expiresAt).not.toBe(expiresAt);
        });

        it("[case] - leaves expiration undefined when not provided", () => {
            // Arrange

            // Act
            const override = createOverride();

            // Assert
            expect(override.expiresAt).toBeUndefined();
        });

        it("[case] - generates id, createdAt, version", () => {
            // Arrange
            const override = createOverride();

            // Act
            const result = isUUID(override.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(override.createdAt).toBeInstanceOf(Date);
            expect(override.version).toBe(1);
            expect(override.updatedAt).toBeUndefined();
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - revokes an active override", () => {
            // Arrange
            const override = createOverride();

            // Act
            override.revoke();

            // Assert
            expect(override.isRevoked).toBe(true);
            expect(override.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already revoked", () => {
            // Arrange
            const override = createOverride();
            override.revoke();

            // Act
            const act = (): unknown => override.revoke();

            // Assert
            expect(act).toThrow("ALREADY_REVOKED");
        });
    });

    describe("[Method] - restore", () => {
        it("[case] - restores a revoked override", () => {
            // Arrange
            const override = createOverride();
            override.revoke();

            // Act
            override.restore();

            // Assert
            expect(override.isRevoked).toBe(false);
            expect(override.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - restores a revoked override with future expiration", () => {
            // Arrange
            const override = createOverride({ expiresAt: new Date(2999, 4, 15, 13, 45, 30, 123) });
            override.revoke();

            // Act
            override.restore();

            // Assert
            expect(override.isRevoked).toBe(false);
            expect(override.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already active", () => {
            // Arrange
            const override = createOverride();

            // Act
            const act = (): unknown => override.restore();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVE");
        });

        it("[case] - throws when expired", () => {
            // Arrange
            const override = createOverride({ expiresAt: new Date(2000, 0, 1, 13, 45, 30, 123) });
            override.revoke();

            // Act
            const act = (): unknown => override.restore();

            // Assert
            expect(act).toThrow("CANNOT_RESTORE_EXPIRED");
        });
    });

    describe("[Method] - canPurge", () => {
        it("[case] - throws for active override", () => {
            // Arrange
            const override = createOverride();

            // Act
            const act = (): unknown => override.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("[case] - passes for revoked override", () => {
            // Arrange
            const override = createOverride();
            override.revoke();

            // Act
            const act = (): unknown => override.canPurge();

            // Assert
            expect(act).not.toThrow();
        });
    });

    describe("[Method] - canCreate", () => {
        it("[case] - passes when non-expiring", () => {
            // Arrange
            const override = createOverride();

            // Act
            const act = (): unknown => override.canCreate();

            // Assert
            expect(act).not.toThrow();
        });

        it("[case] - passes when expiration is in the future", () => {
            // Arrange
            const override = createOverride({ expiresAt: new Date(2999, 4, 15, 13, 45, 30, 123) });

            // Act
            const act = (): unknown => override.canCreate();

            // Assert
            expect(act).not.toThrow();
        });

        it("[case] - throws for expired override", () => {
            // Arrange
            const override = createOverride({ expiresAt: new Date(2000, 0, 1, 13, 45, 30, 123) });

            // Act
            const act = (): unknown => override.canCreate();

            // Assert
            expect(act).toThrow("CANNOT_CREATE_EXPIRED");
        });
    });
});
