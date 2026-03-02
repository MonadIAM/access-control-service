import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { RoleDelegationPolicy } from "./role-delegation-policy.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000000";

function stubRole(overrides?: Partial<Role>): Role {
    return { isRevoked: false, isSystemManaged: false, ...overrides } as Role;
}

function createPolicy(overrides?: Partial<Entities.RoleDelegationPolicy.ConstructorProps>): RoleDelegationPolicy {
    return new RoleDelegationPolicy({
        actor: ACTOR_ID,
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

            const policy = new RoleDelegationPolicy({
                actor: ACTOR_ID,
                delegator,
                target,
                realm,
            });

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

        it("should populate lastActions.create", () => {
            const policy = createPolicy();

            expect(policy.lastActions).toEqual({ create: { by: { id: ACTOR_ID } } });
        });

        it("should assign description when provided", () => {
            const policy = createPolicy({ description: "Allow delegation" });
            expect(policy.description).toBe("Allow delegation");
        });

        it("should leave description undefined when omitted", () => {
            const policy = createPolicy();
            expect(policy.description).toBeUndefined();
        });
    });

    describe("changeData", () => {
        it("should update a single field and return patch", () => {
            const policy = createPolicy({ description: "Old" });

            const patch = policy.changeData({
                actor: ACTOR_ID,
                reason: "update",
                patch: { description: "New" },
            });

            expect(policy.description).toBe("New");
            expect(patch).toEqual({ description: { old: "Old", new: "New" } });
            expect(policy.updatedAt).toBeInstanceOf(Date);
            expect(policy.lastActions.update).toMatchObject({
                by: { id: ACTOR_ID },
                reason: "update",
            });
        });

        it("should update multiple fields at once", () => {
            const policy = createPolicy({ description: "Old", depthLimit: 1 });

            const patch = policy.changeData({
                actor: ACTOR_ID,
                reason: "bulk",
                patch: { description: "New", depthLimit: 3 },
            });

            expect(policy.description).toBe("New");
            expect(policy.depthLimit).toBe(3);
            expect(Object.keys(patch)).toHaveLength(2);
        });

        it("should skip unchanged fields", () => {
            const policy = createPolicy({ description: "Same", depthLimit: 1 });

            const patch = policy.changeData({
                actor: ACTOR_ID,
                reason: "partial",
                patch: { description: "Same", depthLimit: 5 },
            });

            expect(patch).not.toHaveProperty("description");
            expect(patch).toHaveProperty("depthLimit");
        });

        it("should ignore undefined values in patch", () => {
            const policy = createPolicy({ depthLimit: 2 });

            const patch = policy.changeData({
                actor: ACTOR_ID,
                reason: "with undefined",
                patch: { depthLimit: 4, description: undefined },
            });

            expect(patch).toHaveProperty("depthLimit");
            expect(patch).not.toHaveProperty("description");
        });

        it("should throw when patch is empty object", () => {
            const policy = createPolicy();

            expect(() =>
                policy.changeData({
                    actor: ACTOR_ID,
                    reason: "empty",
                    patch: {} as Entities.RoleDelegationPolicy.MutableFields,
                }),
            ).toThrow("EMPTY_UPDATE_PATCH");
        });

        it("should throw when no values actually changed", () => {
            const policy = createPolicy({ description: "Same" });

            expect(() =>
                policy.changeData({
                    actor: ACTOR_ID,
                    reason: "noop",
                    patch: { description: "Same" },
                }),
            ).toThrow("NO_CHANGES_DETECTED");
        });
    });

    describe("revoke", () => {
        it("should revoke an active policy", () => {
            const policy = createPolicy();
            policy.revoke({ actor: ACTOR_ID, reason: "cleanup" });

            expect(policy.isRevoked).toBe(true);
            expect(policy.updatedAt).toBeInstanceOf(Date);
            expect(policy.lastActions.revoke).toMatchObject({ by: { id: ACTOR_ID }, reason: "cleanup" });
        });

        it("should throw when already revoked", () => {
            const policy = createPolicy();
            policy.revoke({ actor: ACTOR_ID, reason: "first" });

            expect(() => policy.revoke({ actor: ACTOR_ID, reason: "second" })).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked policy", () => {
            const policy = createPolicy();
            policy.revoke({ actor: ACTOR_ID, reason: "temp" });
            policy.restore({ actor: ACTOR_ID, reason: "re-enable" });

            expect(policy.isRevoked).toBe(false);
            expect(policy.updatedAt).toBeInstanceOf(Date);
            expect(policy.lastActions.restore).toMatchObject({ by: { id: ACTOR_ID }, reason: "re-enable" });
        });

        it("should throw when already active", () => {
            const policy = createPolicy();

            expect(() => policy.restore({ actor: ACTOR_ID, reason: "noop" })).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active policy", () => {
            const policy = createPolicy();

            expect(() => policy.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for revoked system-managed policy", () => {
            const policy = createPolicy({ isSystemManaged: true });
            policy.revoke({ actor: ACTOR_ID, reason: "purge" });

            expect(() => policy.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for revoked non-system policy", () => {
            const policy = createPolicy();
            policy.revoke({ actor: ACTOR_ID, reason: "purge" });

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
    });
});
