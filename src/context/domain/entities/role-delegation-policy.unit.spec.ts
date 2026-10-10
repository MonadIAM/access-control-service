import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { RoleDelegationPolicy } from "./role-delegation-policy.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

function stubRole(overrides?: Partial<Role>): Role {
    return { isRevoked: false, isSystemManaged: false, ...overrides } as Role;
}

function createPolicy(overrides?: Partial<Entities.RoleDelegationPolicy.ConstructorProps>): RoleDelegationPolicy {
    return new RoleDelegationPolicy({
        delegator: stubRole(),
        target: stubRole(),
        realm: {} as Realm,
        ...overrides,
    });
}

describe("[Entity] - RoleDelegationPolicy", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required relations", () => {
            // Arrange
            const delegator = stubRole();
            const target = stubRole();
            const realm = {} as Realm;

            // Act
            const policy = new RoleDelegationPolicy({ delegator, target, realm });

            // Assert
            expect(policy.delegator).toBe(delegator);
            expect(policy.target).toBe(target);
            expect(policy.realm).toBe(realm);
        });

        it("[case] - defaults booleans and depthLimit", () => {
            // Arrange

            // Act
            const policy = createPolicy();

            // Assert
            expect(policy.isSystemManaged).toBe(false);
            expect(policy.isRevoked).toBe(false);
            expect(policy.depthLimit).toBe(0);
        });

        it("[case] - respects explicit overrides", () => {
            // Arrange

            // Act
            const policy = createPolicy({
                isSystemManaged: true,
                isRevoked: true,
                depthLimit: 5,
            });

            // Assert
            expect(policy.isSystemManaged).toBe(true);
            expect(policy.isRevoked).toBe(true);
            expect(policy.depthLimit).toBe(5);
        });

        it("[case] - generates id, createdAt, version", () => {
            // Arrange
            const policy = createPolicy();

            // Act
            const result = isUUID(policy.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(policy.createdAt).toBeInstanceOf(Date);
            expect(policy.version).toBe(1);
            expect(policy.updatedAt).toBeUndefined();
        });

        it("[case] - assigns justification when provided", () => {
            // Arrange

            // Act
            const policy = createPolicy({ justification: "Allow delegation" });

            // Assert
            expect(policy.justification).toBe("Allow delegation");
        });

        it("[case] - leaves justification undefined when omitted", () => {
            // Arrange

            // Act
            const policy = createPolicy();

            // Assert
            expect(policy.justification).toBeUndefined();
        });

        it("[case] - normalizes explicit expiration to the start of the day", () => {
            // Arrange
            const expiresAt = new Date(2999, 4, 15, 13, 45, 30, 123);
            const expected = new Date(expiresAt);
            expected.setHours(0, 0, 0, 0);

            // Act
            const policy = createPolicy({ expiresAt });

            // Assert
            expect(policy.expiresAt).toEqual(expected);
            expect(policy.expiresAt).not.toBe(expiresAt);
        });

        it("[case] - leaves expiration undefined when not provided", () => {
            // Arrange

            // Act
            const policy = createPolicy();

            // Assert
            expect(policy.expiresAt).toBeUndefined();
        });
    });

    describe("[Method] - update", () => {
        it("[case] - updates a single field", () => {
            // Arrange
            const policy = createPolicy({ justification: "Old" });

            // Act
            policy.update({ patch: { justification: "New" } });

            // Assert
            expect(policy.justification).toBe("New");
            expect(policy.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - updates multiple fields at once", () => {
            // Arrange
            const policy = createPolicy({ justification: "Old", depthLimit: 1 });

            // Act
            policy.update({ patch: { justification: "New", depthLimit: 3 } });

            // Assert
            expect(policy.justification).toBe("New");
            expect(policy.depthLimit).toBe(3);
        });

        it("[case] - skips unchanged fields", () => {
            // Arrange
            const policy = createPolicy({ justification: "Same", depthLimit: 1 });

            // Act
            policy.update({ patch: { justification: "Same", depthLimit: 5 } });

            // Assert
            expect(policy.justification).toBe("Same");
            expect(policy.depthLimit).toBe(5);
        });

        it("[case] - ignores undefined values in patch", () => {
            // Arrange
            const policy = createPolicy({ depthLimit: 2 });

            // Act
            policy.update({ patch: { depthLimit: 4, justification: undefined } });

            // Assert
            expect(policy.depthLimit).toBe(4);
            expect(policy.justification).toBeUndefined();
        });

        it("[case] - throws when patch is empty object", () => {
            // Arrange
            const policy = createPolicy();

            // Act
            const act = (): unknown => policy.update({ patch: {} });

            // Assert
            expect(act).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("[case] - throws when no values actually changed", () => {
            // Arrange
            const policy = createPolicy({ justification: "Same" });

            // Act
            const act = (): unknown => policy.update({ patch: { justification: "Same" } });

            // Assert
            expect(act).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - revokes an active policy", () => {
            // Arrange
            const policy = createPolicy();

            // Act
            policy.revoke();

            // Assert
            expect(policy.isRevoked).toBe(true);
            expect(policy.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already revoked", () => {
            // Arrange
            const policy = createPolicy();
            policy.revoke();

            // Act
            const act = (): unknown => policy.revoke();

            // Assert
            expect(act).toThrow("ALREADY_REVOKED");
        });
    });

    describe("[Method] - restore", () => {
        it("[case] - restores a revoked policy", () => {
            // Arrange
            const policy = createPolicy();
            policy.revoke();

            // Act
            policy.restore();

            // Assert
            expect(policy.isRevoked).toBe(false);
            expect(policy.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when already active", () => {
            // Arrange
            const policy = createPolicy();

            // Act
            const act = (): unknown => policy.restore();

            // Assert
            expect(act).toThrow("ALREADY_ACTIVE");
        });

        it("[case] - restores a revoked policy with future expiration", () => {
            // Arrange
            const policy = createPolicy({ expiresAt: new Date(2999, 4, 15, 13, 45, 30, 123) });
            policy.revoke();

            // Act
            policy.restore();

            // Assert
            expect(policy.isRevoked).toBe(false);
            expect(policy.updatedAt).toBeInstanceOf(Date);
        });

        it("[case] - throws when expired", () => {
            // Arrange
            const policy = createPolicy({ expiresAt: new Date(2000, 0, 1, 13, 45, 30, 123) });
            policy.revoke();

            // Act
            const act = (): unknown => policy.restore();

            // Assert
            expect(act).toThrow("CANNOT_RESTORE_EXPIRED");
        });
    });

    describe("[Method] - canPurge", () => {
        it("[case] - throws for active policy", () => {
            // Arrange
            const policy = createPolicy();

            // Act
            const act = (): unknown => policy.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("[case] - throws for revoked system-managed policy", () => {
            // Arrange
            const policy = createPolicy({ isSystemManaged: true });
            policy.revoke();

            // Act
            const act = (): unknown => policy.canPurge();

            // Assert
            expect(act).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("[case] - passes for revoked non-system policy", () => {
            // Arrange
            const policy = createPolicy();
            policy.revoke();

            // Act
            const act = (): unknown => policy.canPurge();

            // Assert
            expect(act).not.toThrow();
        });
    });

    describe("[Method] - canCreate", () => {
        it("[case] - passes when both roles are active and non-system", () => {
            // Arrange
            const policy = createPolicy();

            // Act
            const act = (): unknown => policy.canCreate();

            // Assert
            expect(act).not.toThrow();
        });

        it("[case] - throws for revoked target", () => {
            // Arrange
            const policy = createPolicy({ target: stubRole({ isRevoked: true }) });

            // Act
            const act = (): unknown => policy.canCreate();

            // Assert
            expect(act).toThrow("CANNOT_DELEGATE_REVOKED_TARGET");
        });

        it("[case] - throws for system-managed target", () => {
            // Arrange
            const policy = createPolicy({ target: stubRole({ isSystemManaged: true }) });

            // Act
            const act = (): unknown => policy.canCreate();

            // Assert
            expect(act).toThrow("CANNOT_DELEGATE_SYSTEM_TARGET");
        });

        it("[case] - throws for revoked delegator", () => {
            // Arrange
            const policy = createPolicy({ delegator: stubRole({ isRevoked: true }) });

            // Act
            const act = (): unknown => policy.canCreate();

            // Assert
            expect(act).toThrow("REVOKED_ROLE_CANNOT_DELEGATE_ROLES");
        });

        it("[case] - passes when expiration is in the future", () => {
            // Arrange
            const policy = createPolicy({ expiresAt: new Date(2999, 4, 15, 13, 45, 30, 123) });

            // Act
            const act = (): unknown => policy.canCreate();

            // Assert
            expect(act).not.toThrow();
        });

        it("[case] - throws for expired policy", () => {
            // Arrange
            const policy = createPolicy({ expiresAt: new Date(2000, 0, 1, 13, 45, 30, 123) });

            // Act
            const act = (): unknown => policy.canCreate();

            // Assert
            expect(act).toThrow("CANNOT_DELEGATE_EXPIRED");
        });
    });
});
