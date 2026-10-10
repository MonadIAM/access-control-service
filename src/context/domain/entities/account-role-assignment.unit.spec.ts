import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { AccountRoleAssignment } from "./account-role-assignment.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";

function stubRole(overrides?: Partial<Role>): Role {
    return { isRevoked: false, isSystemManaged: false, ...overrides } as Role;
}

function createAssignment(overrides?: Partial<Entities.AccountRoleAssignment.ConstructorProps>): AccountRoleAssignment {
    return new AccountRoleAssignment({
        account: ACCOUNT_ID,
        realm: {} as Realm,
        role: stubRole(),
        ...overrides,
    });
}

describe("[Entity] - AccountRoleAssignment", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields and relations", () => {
            // Arrange
            const realm = {} as Realm;
            const role = stubRole();

            // Act
            const assignment = createAssignment({ account: ACCOUNT_ID, realm, role });

            // Assert
            expect(assignment.account).toBe(ACCOUNT_ID);
            expect(assignment.realm).toBe(realm);
            expect(assignment.role).toBe(role);
        });

        it("[case] - defaults booleans to false", () => {
            // Arrange

            // Act
            const assignment = createAssignment();

            // Assert
            expect(assignment.isSystemManaged).toBe(false);
            expect(assignment.isRevoked).toBe(false);
        });

        it("[case] - respects explicit boolean overrides", () => {
            // Arrange

            // Act
            const assignment = createAssignment({ isSystemManaged: true, isRevoked: true });

            // Assert
            expect(assignment.isSystemManaged).toBe(true);
            expect(assignment.isRevoked).toBe(true);
        });

        it("[case] - normalizes explicit expiration to the start of the day", () => {
            // Arrange
            const expiresAt = new Date(2999, 4, 15, 13, 45, 30, 123);
            const expected = new Date(expiresAt);
            expected.setHours(0, 0, 0, 0);

            // Act
            const assignment = createAssignment({ expiresAt });

            // Assert
            expect(assignment.expiresAt).toEqual(expected);
            expect(assignment.expiresAt).not.toBe(expiresAt);
        });

        it("[case] - leaves expiration undefined when not provided", () => {
            // Arrange

            // Act
            const assignment = createAssignment();

            // Assert
            expect(assignment.expiresAt).toBeUndefined();
        });

        it("[case] - generates id, createdAt, version", () => {
            // Arrange
            const assignment = createAssignment();

            // Act
            const result = isUUID(assignment.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(assignment.createdAt).toBeInstanceOf(Date);
            expect(assignment.version).toBe(1);
            expect(assignment.updatedAt).toBeUndefined();
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - revokes an active assignment", () => {
            // Arrange
            const assignment = createAssignment();

            // Act
            assignment.revoke();

            // Assert
            expect(assignment.isRevoked).toBe(true);
            expect(assignment.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already revoked", () => {
            // Arrange
            const assignment = createAssignment();
            assignment.revoke();

            // Act
            const act = (): unknown => assignment.revoke();

            // Assert
            expect(act).toThrow("ALREADY_REVOKED");
        });
    });

    describe("[Method] - restore", () => {
        it("[case] - restores a revoked assignment", () => {
            // Arrange
            const assignment = createAssignment();
            assignment.revoke();

            // Act
            assignment.restore();

            // Assert
            expect(assignment.isRevoked).toBe(false);
            expect(assignment.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - restores a revoked assignment with future expiration", () => {
            // Arrange
            const assignment = createAssignment({ expiresAt: new Date(2999, 4, 15, 13, 45, 30, 123) });
            assignment.revoke();

            // Act
            assignment.restore();

            // Assert
            expect(assignment.isRevoked).toBe(false);
            expect(assignment.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already active", () => {
            // Arrange
            const assignment = createAssignment();

            // Act
            const act = (): unknown => assignment.restore();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVE");
        });

        it("[case] - throws when expired", () => {
            // Arrange
            const assignment = createAssignment({ expiresAt: new Date(2000, 0, 1, 13, 45, 30, 123) });
            assignment.revoke();

            // Act
            const act = (): unknown => assignment.restore();

            // Assert
            expect(act).toThrow("CANNOT_RESTORE_EXPIRED");
        });
    });

    describe("[Method] - canPurge", () => {
        it("[case] - throws for active assignment", () => {
            // Arrange
            const assignment = createAssignment();

            // Act
            const act = (): unknown => assignment.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("[case] - throws for revoked system-managed assignment", () => {
            // Arrange
            const assignment = createAssignment({ isSystemManaged: true });
            assignment.revoke();

            // Act
            const act = (): unknown => assignment.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("[case] - passes for revoked non-system assignment", () => {
            // Arrange
            const assignment = createAssignment();
            assignment.revoke();

            // Act
            const act = (): unknown => assignment.canPurge();

            // Assert
            expect(act).not.toThrow();
        });
    });

    describe("[Method] - canAssign", () => {
        it("[case] - passes when role is active and non-system", () => {
            // Arrange
            const assignment = createAssignment();

            // Act
            const act = (): unknown => assignment.canAssign();

            // Assert
            expect(act).not.toThrow();
        });

        it("[case] - passes when expiration is in the future", () => {
            // Arrange
            const assignment = createAssignment({ expiresAt: new Date(2999, 4, 15, 13, 45, 30, 123) });

            // Act
            const act = (): unknown => assignment.canAssign();

            // Assert
            expect(act).not.toThrow();
        });

        it("[case] - throws for revoked role", () => {
            // Arrange
            const assignment = createAssignment({ role: stubRole({ isRevoked: true }) });

            // Act
            const act = (): unknown => assignment.canAssign();

            // Assert
            expect(act).toThrow("CANNOT_ASSIGN_REVOKED_ROLE");
        });

        it("[case] - throws for system-managed role", () => {
            // Arrange
            const assignment = createAssignment({ role: stubRole({ isSystemManaged: true }) });

            // Act
            const act = (): unknown => assignment.canAssign();

            // Assert
            expect(act).toThrow("CANNOT_ASSIGN_SYSTEM_ROLE");
        });

        it("[case] - throws for expired assignment", () => {
            // Arrange
            const assignment = createAssignment({ expiresAt: new Date(2000, 0, 1, 13, 45, 30, 123) });

            // Act
            const act = (): unknown => assignment.canAssign();

            // Assert
            expect(act).toThrow("CANNOT_ASSIGN_EXPIRED");
        });
    });
});
