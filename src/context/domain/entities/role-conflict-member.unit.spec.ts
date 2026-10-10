import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { RoleConflictMember } from "./role-conflict-member.entity";
import { RoleConflictGroup } from "./role-conflict-group.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

function createGroup(overrides?: Partial<Entities.RoleConflictGroup.ConstructorProps>): RoleConflictGroup {
    return new RoleConflictGroup({
        code: "SoD_FINANCE",
        name: "Finance Separation",
        maxAllowed: 1,
        realm: {} as Realm,
        ...overrides,
    });
}

function createMember(overrides?: Partial<Entities.RoleConflictMember.ConstructorProps>): RoleConflictMember {
    return new RoleConflictMember({
        group: createGroup(),
        role: {} as Role,
        ...overrides,
    });
}

describe("[Entity] - RoleConflictMember", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required relations", () => {
            // Arrange
            const group = {} as RoleConflictGroup;
            const role = {} as Role;

            // Act
            const member = new RoleConflictMember({ group, role });

            // Assert
            expect(member.group).toBe(group);
            expect(member.role).toBe(role);
        });

        it("[case] - defaults booleans to false", () => {
            // Arrange

            // Act
            const member = createMember();

            // Assert
            expect(member.isSystemManaged).toBe(false);
            expect(member.isRevoked).toBe(false);
        });

        it("[case] - respects explicit boolean overrides", () => {
            // Arrange

            // Act
            const member = createMember({ isSystemManaged: true, isRevoked: true });

            // Assert
            expect(member.isSystemManaged).toBe(true);
            expect(member.isRevoked).toBe(true);
        });

        it("[case] - generates id, createdAt, version", () => {
            // Arrange
            const member = createMember();

            // Act
            const result = isUUID(member.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(member.createdAt).toBeInstanceOf(Date);
            expect(member.version).toBe(1);
            expect(member.updatedAt).toBeUndefined();
        });
    });

    describe("[Method] - canPurge", () => {
        it("[case] - throws for system-managed member", () => {
            // Arrange
            const member = createMember({ isSystemManaged: true });

            // Act
            const act = (): unknown => member.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("[case] - passes for non-system member", () => {
            // Arrange
            const member = createMember();

            // Act
            const act = (): unknown => member.canPurge();

            // Assert
            expect(act).not.toThrow();
        });

        it("[case] - throws when the owning group is revoked", () => {
            // Arrange
            const group = createGroup();
            group.revoke();
            const member = createMember({ group });

            // Act
            const act = (): unknown => member.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_MODIFY_MEMBERS_REVOKED");
        });
    });
});
