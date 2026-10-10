import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { RoleConflictGroup } from "./role-conflict-group.entity";
import { Realm } from "./realm.entity";

function createGroup(overrides?: Partial<Entities.RoleConflictGroup.ConstructorProps>): RoleConflictGroup {
    return new RoleConflictGroup({
        code: "SoD_FINANCE",
        name: "Finance Separation",
        maxAllowed: 1,
        realm: {} as Realm,
        ...overrides,
    });
}

describe("[Entity] - RoleConflictGroup", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange
            const realm = {} as Realm;

            // Act
            const group = new RoleConflictGroup({
                code: "SoD_OPS",
                name: "Ops Separation",
                maxAllowed: 2,
                realm,
            });

            // Assert
            expect(group.code).toBe("SoD_OPS");
            expect(group.name).toBe("Ops Separation");
            expect(group.maxAllowed).toBe(2);
            expect(group.realm).toBe(realm);
        });

        it("[case] - defaults booleans to false", () => {
            // Arrange

            // Act
            const group = createGroup();

            // Assert
            expect(group.isSystemManaged).toBe(false);
            expect(group.isRevoked).toBe(false);
        });

        it("[case] - respects explicit boolean overrides", () => {
            // Arrange

            // Act
            const group = createGroup({ isSystemManaged: true, isRevoked: true });

            // Assert
            expect(group.isSystemManaged).toBe(true);
            expect(group.isRevoked).toBe(true);
        });

        it("[case] - generates id, createdAt, version", () => {
            // Arrange
            const group = createGroup();

            // Act
            const result = isUUID(group.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(group.createdAt).toBeInstanceOf(Date);
            expect(group.version).toBe(1);
            expect(group.updatedAt).toBeUndefined();
        });

        it("[case] - assigns description when provided", () => {
            // Arrange

            // Act
            const group = createGroup({ description: "Prevents dual control" });

            // Assert
            expect(group.description).toBe("Prevents dual control");
        });

        it("[case] - leaves description undefined when omitted", () => {
            // Arrange

            // Act
            const group = createGroup();

            // Assert
            expect(group.description).toBeUndefined();
        });
    });

    describe("[Method] - update", () => {
        it("[case] - updates a single field", () => {
            // Arrange
            const group = createGroup({ name: "Old" });

            // Act
            group.update({ patch: { name: "New" } });

            // Assert
            expect(group.name).toBe("New");
            expect(group.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - updates multiple fields at once", () => {
            // Arrange
            const group = createGroup({ name: "Old", maxAllowed: 1 });

            // Act
            group.update({ patch: { name: "New", maxAllowed: 3 } });

            // Assert
            expect(group.name).toBe("New");
            expect(group.maxAllowed).toBe(3);
        });

        it("[case] - skips unchanged fields", () => {
            // Arrange
            const group = createGroup({ name: "Same", maxAllowed: 1 });

            // Act
            group.update({ patch: { name: "Same", maxAllowed: 5 } });

            // Assert
            expect(group.name).toBe("Same");
            expect(group.maxAllowed).toBe(5);
        });

        it("[case] - ignores undefined values in patch", () => {
            // Arrange
            const group = createGroup({ maxAllowed: 1 });

            // Act
            group.update({ patch: { maxAllowed: 2, description: undefined } });

            // Assert
            expect(group.maxAllowed).toBe(2);
            expect(group.description).toBeUndefined();
        });

        it("[case] - throws when patch is empty object", () => {
            // Arrange
            const group = createGroup();

            // Act
            const act = (): unknown => group.update({ patch: {} });

            // Assert
            expect(act).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("[case] - throws when no values actually changed", () => {
            // Arrange
            const group = createGroup({ name: "Same" });

            // Act
            const act = (): unknown => group.update({ patch: { name: "Same" } });

            // Assert
            expect(act).toThrow("NO_CHANGES_DETECTED");
        });

        it("[case] - throws when the group is revoked", () => {
            // Arrange
            const group = createGroup();
            group.revoke();

            // Act
            const act = (): unknown => group.update({ patch: { name: "New" } });

            // Assert
            expect(act).toThrow("CANNOT_UPDATE_REVOKED");
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - revokes an active group", () => {
            // Arrange
            const group = createGroup();

            // Act
            group.revoke();

            // Assert
            expect(group.isRevoked).toBe(true);
            expect(group.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already revoked", () => {
            // Arrange
            const group = createGroup();
            group.revoke();

            // Act
            const act = (): unknown => group.revoke();

            // Assert
            expect(act).toThrow("ALREADY_REVOKED");
        });
    });

    describe("[Method] - restore", () => {
        it("[case] - restores a revoked group", () => {
            // Arrange
            const group = createGroup();
            group.revoke();

            // Act
            group.restore();

            // Assert
            expect(group.isRevoked).toBe(false);
            expect(group.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already active", () => {
            // Arrange
            const group = createGroup();

            // Act
            const act = (): unknown => group.restore();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("[Method] - canPurge", () => {
        it("[case] - throws for active group", () => {
            // Arrange
            const group = createGroup();

            // Act
            const act = (): unknown => group.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("[case] - throws for revoked system-managed group", () => {
            // Arrange
            const group = createGroup({ isSystemManaged: true });
            group.revoke();

            // Act
            const act = (): unknown => group.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("[case] - passes for revoked non-system group", () => {
            // Arrange
            const group = createGroup();
            group.revoke();

            // Act
            const act = (): unknown => group.canPurge();

            // Assert
            expect(act).not.toThrow();
        });
    });

    describe("[Method] - canModifyMembers", () => {
        it("[case] - throws when the group is revoked", () => {
            // Arrange
            const group = createGroup();
            group.revoke();

            // Act
            const act = (): unknown => group.canModifyMembers();

            // Assert
            expect(act).toThrow("CANNOT_MODIFY_MEMBERS_REVOKED");
        });

        it("[case] - passes for an active group", () => {
            // Arrange
            const group = createGroup();

            // Act
            const act = (): unknown => group.canModifyMembers();

            // Assert
            expect(act).not.toThrow();
        });
    });
});
