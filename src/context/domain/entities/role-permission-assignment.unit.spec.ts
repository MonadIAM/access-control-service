import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { AssignmentScope } from "~context/enums";

import { RolePermissionAssignment } from "./role-permission-assignment.entity";
import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

function stubRole(overrides?: Partial<Role>): Role {
    return { isRevoked: false, isSystemManaged: false, ...overrides } as Role;
}

function stubPermission(overrides?: Partial<Permission>): Permission {
    return { isRevoked: false, isSystemManaged: false, ...overrides } as Permission;
}

function createAssignment(
    overrides?: Partial<Entities.RolePermissionAssignment.ConstructorProps>,
): RolePermissionAssignment {
    return new RolePermissionAssignment({
        permission: stubPermission(),
        realm: {} as Realm,
        role: stubRole(),
        ...overrides,
    });
}

describe("[Entity] - RolePermissionAssignment", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required relations", () => {
            // Arrange
            const role = stubRole();
            const permission = stubPermission();
            const realm = {} as Realm;

            // Act
            const assignment = new RolePermissionAssignment({ permission, realm, role });

            // Assert
            expect(assignment.role).toBe(role);
            expect(assignment.permission).toBe(permission);
            expect(assignment.realm).toBe(realm);
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

        it("[case] - generates id, createdAt, version and set scope", () => {
            // Arrange
            const assignment = createAssignment();

            // Act
            const result = isUUID(assignment.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(assignment.createdAt).toBeInstanceOf(Date);
            expect(assignment.version).toBe(1);
            expect(assignment.updatedAt).toBeUndefined();
            expect(assignment.scope).toBe(AssignmentScope.REALM);
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

        it("[case] - throws when already active", () => {
            // Arrange
            const assignment = createAssignment();

            // Act
            const act = (): unknown => assignment.restore();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVE");
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
        it("[case] - passes when role and permission are active and non-system", () => {
            // Arrange
            const assignment = createAssignment();

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
            expect(act).toThrow("CANNOT_ASSIGN_TO_REVOKED_ROLE");
        });

        it("[case] - throws for revoked permission", () => {
            // Arrange
            const assignment = createAssignment({ permission: stubPermission({ isRevoked: true }) });

            // Act
            const act = (): unknown => assignment.canAssign();

            // Assert
            expect(act).toThrow("CANNOT_ASSIGN_REVOKED_PERMISSION");
        });

        it("[case] - throws for system-managed role", () => {
            // Arrange
            const assignment = createAssignment({ role: stubRole({ isSystemManaged: true }) });

            // Act
            const act = (): unknown => assignment.canAssign();

            // Assert
            expect(act).toThrow("CANNOT_ASSIGN_TO_SYSTEM_ROLE");
        });

        it("[case] - throws for system-managed permission", () => {
            // Arrange
            const assignment = createAssignment({ permission: stubPermission({ isSystemManaged: true }) });

            // Act
            const act = (): unknown => assignment.canAssign();

            // Assert
            expect(act).toThrow("CANNOT_ASSIGN_SYSTEM_PERMISSION");
        });
    });
});
