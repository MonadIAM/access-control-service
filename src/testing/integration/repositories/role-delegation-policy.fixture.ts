import { randomUUID } from "node:crypto";

import { CoreFixture } from "./core.fixture";

export class RoleDelegationPolicyFixture extends CoreFixture implements Fixtures.RoleDelegationPolicy.Contract {
    /**
     * Builds account role grants and delegation policies to verify allowed and denied target roles.
     */
    public async allowedScenario(): Fixtures.RoleDelegationPolicy.AllowedScenario.Result {
        const actor = randomUUID();
        const realm = await this.createRealm({ code: "allowed-delegation", name: "Allowed Delegation" });
        const foreignRealm = await this.createRealm({
            code: "allowed-delegation-foreign",
            name: "Foreign Allowed Delegation",
        });
        const delegatorRole = await this.createRole({ realm, code: "roles.delegator", name: "Delegator Role" });
        const parentRole = await this.createRole({ realm, code: "roles.parent", name: "Parent Role" });
        const childRole = await this.createRole({ realm, code: "roles.child", name: "Child Role" });
        const grandchildRole = await this.createRole({ realm, code: "roles.grandchild", name: "Grandchild Role" });
        const foreignRole = await this.createRole({
            realm: foreignRealm,
            code: "roles.foreign",
            name: "Foreign Role",
        });

        await this.createRoleClosure({ realm, ancestor: parentRole, descendant: childRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: childRole, descendant: grandchildRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: parentRole, descendant: grandchildRole, depth: 2 });
        await this.createRoleClosure({ realm: foreignRealm, ancestor: parentRole, descendant: foreignRole, depth: 1 });
        await this.createAccountRoleAssignment({ realm, role: delegatorRole, account: actor });
        await this.createRoleDelegationPolicy({
            delegator: delegatorRole,
            target: parentRole,
            depthLimit: 1,
            realm,
        });

        return {
            allowedRoles: [parentRole, childRole],
            foreignDeniedRoles: [foreignRole],
            deniedRoles: [grandchildRole],
            actor,
            realm,
        };
    }

    /**
     * Builds duplicate policy matches where not every requested target is allowed.
     */
    public async duplicateTargetsScenario(): Fixtures.RoleDelegationPolicy.DuplicateTargetsScenario.Result {
        const actor = randomUUID();
        const realm = await this.createRealm({
            code: "duplicate-allowed-targets",
            name: "Duplicate Allowed Targets",
        });
        const delegatorRole = await this.createRole({ realm, code: "roles.delegator", name: "Delegator Role" });
        const parentRole = await this.createRole({ realm, code: "roles.parent", name: "Parent Role" });
        const childRole = await this.createRole({ realm, code: "roles.child", name: "Child Role" });
        const unrelatedRole = await this.createRole({ realm, code: "roles.unrelated", name: "Unrelated Role" });

        await this.createRoleClosure({ realm, ancestor: parentRole, descendant: childRole, depth: 1 });
        await this.createAccountRoleAssignment({ realm, role: delegatorRole, account: actor });
        await this.createRoleDelegationPolicy({
            delegator: delegatorRole,
            target: parentRole,
            depthLimit: 1,
            realm,
        });
        await this.createRoleDelegationPolicy({
            delegator: delegatorRole,
            target: childRole,
            depthLimit: 0,
            realm,
        });

        return {
            requestedRoles: [childRole, unrelatedRole],
            expectedResult: false,
            actor,
            realm,
        };
    }

    /**
     * Builds an expired actor role assignment to verify delegation checks ignore elapsed grants.
     */
    public async expiredActorScenario(): Fixtures.RoleDelegationPolicy.ExpiredActorScenario.Result {
        const actor = randomUUID();
        const realm = await this.createRealm({
            code: "expired-actor-delegation",
            name: "Expired Actor Delegation",
        });
        const delegatorRole = await this.createRole({ realm, code: "roles.delegator", name: "Delegator Role" });
        const targetRole = await this.createRole({ realm, code: "roles.target", name: "Target Role" });

        await this.createAccountRoleAssignment({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            role: delegatorRole,
            account: actor,
            realm,
        });
        await this.createRoleDelegationPolicy({
            delegator: delegatorRole,
            target: targetRole,
            depthLimit: 0,
            realm,
        });

        return {
            deniedRoles: [targetRole],
            actor,
            realm,
        };
    }

    /**
     * Builds active, revoked, and expired delegation policies to verify the configured per-delegator policy limit.
     */
    public async limitScenario(): Fixtures.RoleDelegationPolicy.LimitScenario.Result {
        const realm = await this.createRealm({ code: "delegation-policy-limit", name: "Delegation Policy Limit" });
        const delegatorRole = await this.createRole({ realm, code: "roles.delegator", name: "Delegator Role" });
        const firstTarget = await this.createRole({ realm, code: "roles.first-target", name: "First Target Role" });
        const secondTarget = await this.createRole({ realm, code: "roles.second-target", name: "Second Target Role" });
        const revokedTarget = await this.createRole({ realm, code: "roles.revoked-target", name: "Revoked Target Role" });
        const expiredTarget = await this.createRole({ realm, code: "roles.expired-target", name: "Expired Target Role" });

        await this.createRoleDelegationPolicy({ realm, delegator: delegatorRole, target: firstTarget });
        await this.createRoleDelegationPolicy({ realm, delegator: delegatorRole, target: secondTarget });
        await this.createRoleDelegationPolicy({
            delegator: delegatorRole,
            target: revokedTarget,
            isRevoked: true,
            realm,
        });
        await this.createRoleDelegationPolicy({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            delegator: delegatorRole,
            target: expiredTarget,
            realm,
        });

        return {
            expectedCountOneResult: false,
            expectedCountTwoResult: true,
            delegator: delegatorRole,
            realm,
        };
    }

    /**
     * Builds active and expired delegation policies to verify transitive reachability.
     */
    public async transitiveScenario(): Fixtures.RoleDelegationPolicy.TransitiveScenario.Result {
        const realm = await this.createRealm({ code: "transitive-delegation", name: "Transitive Delegation" });
        const foreignRealm = await this.createRealm({
            code: "transitive-delegation-foreign",
            name: "Foreign Transitive Delegation",
        });
        const firstRole = await this.createRole({ realm, code: "roles.first", name: "First Role" });
        const secondRole = await this.createRole({ realm, code: "roles.second", name: "Second Role" });
        const thirdRole = await this.createRole({ realm, code: "roles.third", name: "Third Role" });
        const expiredRole = await this.createRole({ realm, code: "roles.expired", name: "Expired Role" });
        const realmBlockedRole = await this.createRole({
            realm: foreignRealm,
            code: "roles.realm-blocked",
            name: "Realm Blocked Role",
        });

        await this.createRoleClosure({ realm: foreignRealm, ancestor: secondRole, descendant: realmBlockedRole, depth: 1 });
        await this.createRoleDelegationPolicy({ realm, delegator: firstRole, target: secondRole });
        await this.createRoleDelegationPolicy({ realm, delegator: secondRole, target: thirdRole });
        await this.createRoleDelegationPolicy({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            delegator: firstRole,
            target: expiredRole,
            realm,
        });

        return {
            blockedRole: expiredRole,
            reachableRole: thirdRole,
            realmBlockedRole,
            from: firstRole,
        };
    }
}
