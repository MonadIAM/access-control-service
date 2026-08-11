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

describe("RoleDelegationPolicy Entity", () => {
    describe("constructor", () => {
        it("should assign required relations", () => {
            const delegator = stubRole();
            const target = stubRole();
            const realm = {} as Realm;

            const policy = new RoleDelegationPolicy({ delegator, target, realm });

            expect(policy.delegator).toBe(delegator);
            expect(policy.target).toBe(target);
            expect(policy.realm).toBe(realm);
        });

        it("should default booleans and depthLimit", () => {
            const policy = createPolicy();

            expect(policy.isSystemManaged).toBe(false);
            expect(policy.isRevoked).toBe(false);
            expect(policy.depthLimit).toBe(0);
        });

        it("should respect explicit overrides", () => {
            const policy = createPolicy({
                isSystemManaged: true,
                isRevoked: true,
                depthLimit: 5,
            });

            expect(policy.isSystemManaged).toBe(true);
            expect(policy.isRevoked).toBe(true);
            expect(policy.depthLimit).toBe(5);
        });

        it("should auto-generate id, createdAt, version", () => {
            const policy = createPolicy();

            expect(isUUID(policy.id, "4")).toBe(true);
            expect(policy.createdAt).toBeInstanceOf(Date);
            expect(policy.version).toBe(1);
            expect(policy.updatedAt).toBeUndefined();
        });

        it("should assign description when provided", () => {
            const policy = createPolicy({ description: "Allow delegation" });
            expect(policy.description).toBe("Allow delegation");
        });

        it("should leave description undefined when omitted", () => {
            const policy = createPolicy();
            expect(policy.description).toBeUndefined();
        });

        it("should normalize explicit expiration to the start of the day", () => {
            const expiresAt = new Date(2999, 4, 15, 13, 45, 30, 123);
            const expected = new Date(expiresAt);
            expected.setHours(0, 0, 0, 0);

            const policy = createPolicy({ expiresAt });

            expect(policy.expiresAt).toEqual(expected);
            expect(policy.expiresAt).not.toBe(expiresAt);
        });

        it("should leave expiration undefined when not provided", () => {
            const policy = createPolicy();

            expect(policy.expiresAt).toBeUndefined();
        });
    });

    describe("update", () => {
        it("should update a single field", () => {
            const policy = createPolicy({ description: "Old" });

            policy.update({ patch: { description: "New" } });

            expect(policy.description).toBe("New");
            expect(policy.updatedAt).toBeInstanceOf(Date);
        });

        it("should update multiple fields at once", () => {
            const policy = createPolicy({ description: "Old", depthLimit: 1 });

            policy.update({ patch: { description: "New", depthLimit: 3 } });

            expect(policy.description).toBe("New");
            expect(policy.depthLimit).toBe(3);
        });

        it("should skip unchanged fields", () => {
            const policy = createPolicy({ description: "Same", depthLimit: 1 });

            policy.update({ patch: { description: "Same", depthLimit: 5 } });

            expect(policy.description).toBe("Same");
            expect(policy.depthLimit).toBe(5);
        });

        it("should ignore undefined values in patch", () => {
            const policy = createPolicy({ depthLimit: 2 });

            policy.update({ patch: { depthLimit: 4, description: undefined } });

            expect(policy.depthLimit).toBe(4);
            expect(policy.description).toBeUndefined();
        });

        it("should throw when patch is empty object", () => {
            const policy = createPolicy();

            expect(() => policy.update({ patch: {} })).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const policy = createPolicy({ description: "Same" });

            expect(() => policy.update({ patch: { description: "Same" } })).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active policy", () => {
            const policy = createPolicy();
            policy.revoke();

            expect(policy.isRevoked).toBe(true);
            expect(policy.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const policy = createPolicy();
            policy.revoke();

            expect(() => policy.revoke()).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked policy", () => {
            const policy = createPolicy();
            policy.revoke();
            policy.restore();

            expect(policy.isRevoked).toBe(false);
            expect(policy.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already active", () => {
            const policy = createPolicy();

            expect(() => policy.restore()).toThrow("ALREADY_ACTIVE");
        });

        it("should restore a revoked policy with future expiration", () => {
            const policy = createPolicy({ expiresAt: new Date(2999, 4, 15, 13, 45, 30, 123) });
            policy.revoke();
            policy.restore();

            expect(policy.isRevoked).toBe(false);
            expect(policy.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when expired", () => {
            const policy = createPolicy({ expiresAt: new Date(2000, 0, 1, 13, 45, 30, 123) });
            policy.revoke();

            expect(() => policy.restore()).toThrow("CANNOT_RESTORE_EXPIRED");
        });
    });

    describe("canPurge", () => {
        it("should throw for active policy", () => {
            const policy = createPolicy();

            expect(() => policy.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for revoked system-managed policy", () => {
            const policy = createPolicy({ isSystemManaged: true });
            policy.revoke();

            expect(() => policy.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for revoked non-system policy", () => {
            const policy = createPolicy();
            policy.revoke();

            expect(() => policy.canPurge()).not.toThrow();
        });
    });

    describe("canCreate", () => {
        it("should pass when both roles are active and non-system", () => {
            const policy = createPolicy();

            expect(() => policy.canCreate()).not.toThrow();
        });

        it("should throw for revoked target", () => {
            const policy = createPolicy({ target: stubRole({ isRevoked: true }) });

            expect(() => policy.canCreate()).toThrow("CANNOT_DELEGATE_REVOKED_TARGET");
        });

        it("should throw for system-managed target", () => {
            const policy = createPolicy({ target: stubRole({ isSystemManaged: true }) });

            expect(() => policy.canCreate()).toThrow("CANNOT_DELEGATE_SYSTEM_TARGET");
        });

        it("should throw for revoked delegator", () => {
            const policy = createPolicy({ delegator: stubRole({ isRevoked: true }) });

            expect(() => policy.canCreate()).toThrow("REVOKED_ROLE_CANNOT_DELEGATE_ROLES");
        });

        it("should pass when expiration is in the future", () => {
            const policy = createPolicy({ expiresAt: new Date(2999, 4, 15, 13, 45, 30, 123) });

            expect(() => policy.canCreate()).not.toThrow();
        });

        it("should throw for expired policy", () => {
            const policy = createPolicy({ expiresAt: new Date(2000, 0, 1, 13, 45, 30, 123) });

            expect(() => policy.canCreate()).toThrow("CANNOT_DELEGATE_EXPIRED");
        });
    });
});
