import { randomUUID } from "node:crypto";

import { CoreFixture } from "./core.fixture";

export class RoleFixture extends CoreFixture implements Fixtures.Role.Contract {
    /**
     * Builds account assignments through descendant roles to verify accounts affected by a role.
     */
    public async accountsScenario(): Fixtures.Role.AccountsScenario.Result {
        const realm = await this.createRealm({ code: "accounts-by-roles", name: "Accounts By Roles" });
        const foreignRealm = await this.createRealm({
            code: "accounts-by-roles-foreign",
            name: "Foreign Accounts By Roles",
        });
        const parentRole = await this.createRole({ realm, code: "roles.parent", name: "Parent Role" });
        const childRole = await this.createRole({ realm, code: "roles.child", name: "Child Role" });
        const unrelatedRole = await this.createRole({ realm, code: "roles.unrelated", name: "Unrelated Role" });
        const inheritedAccount = randomUUID();
        const directAccount = randomUUID();
        const revokedAccount = randomUUID();
        const expiredAccount = randomUUID();
        const foreignAccount = randomUUID();
        const unrelatedAccount = randomUUID();

        await this.createRoleClosure({ realm, ancestor: parentRole, descendant: childRole, depth: 1 });
        await this.createAccountRoleAssignment({ realm, role: childRole, account: inheritedAccount });
        await this.createAccountRoleAssignment({ realm, role: parentRole, account: directAccount });
        await this.createAccountRoleAssignment({ realm, role: childRole, account: revokedAccount, isRevoked: true });
        await this.createAccountRoleAssignment({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            account: expiredAccount,
            role: childRole,
            realm,
        });
        await this.createAccountRoleAssignment({ realm: foreignRealm, role: childRole, account: foreignAccount });
        await this.createAccountRoleAssignment({ realm, role: unrelatedRole, account: unrelatedAccount });

        return {
            expectedAccounts: [directAccount, inheritedAccount],
            role: parentRole,
        };
    }

    /**
     * Builds account grants and delegation policies with depth limits to verify delegable roles.
     */
    public async delegableScenario(): Fixtures.Role.DelegableScenario.Result {
        const account = randomUUID();
        const realm = await this.createRealm({ code: "delegable-by-account", name: "Delegable By Account" });
        const delegatorRole = await this.createRole({ realm, code: "roles.delegator", name: "Delegator Role" });
        const parentRole = await this.createRole({ realm, code: "roles.parent", name: "Parent Role" });
        const childRole = await this.createRole({ realm, code: "roles.child", name: "Child Role" });
        const grandchildRole = await this.createRole({ realm, code: "roles.grandchild", name: "Grandchild Role" });
        const revokedPolicyRole = await this.createRole({
            code: "roles.revoked-policy",
            name: "Revoked Policy Role",
            realm,
        });

        await this.createRoleClosure({ realm, ancestor: parentRole, descendant: childRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: childRole, descendant: grandchildRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: parentRole, descendant: grandchildRole, depth: 2 });
        await this.createAccountRoleAssignment({ realm, role: delegatorRole, account });
        await this.createRoleDelegationPolicy({
            delegator: delegatorRole,
            target: parentRole,
            depthLimit: 1,
            realm,
        });
        await this.createRoleDelegationPolicy({
            delegator: delegatorRole,
            target: revokedPolicyRole,
            isRevoked: true,
            depthLimit: 0,
            realm,
        });

        return {
            expectedRoleCodes: ["roles.child", "roles.parent"],
            account,
            realm,
        };
    }

    /**
     * Builds delegable roles with equal creation timestamps to verify stable page boundaries.
     */
    public async delegablePageScenario(): Fixtures.Role.DelegablePageScenario.Result {
        const account = randomUUID();
        const createdAt = new Date("2026-01-01T00:00:00.000Z");
        const realm = await this.createRealm({ code: "delegable-page", name: "Delegable Page" });
        const delegatorRole = await this.createRole({ realm, code: "roles.delegator", name: "Delegator Role" });
        const firstTarget = await this.createRole({ realm, code: "roles.page-first", name: "Page First Role" });
        const secondTarget = await this.createRole({ realm, code: "roles.page-second", name: "Page Second Role" });
        const thirdTarget = await this.createRole({ realm, code: "roles.page-third", name: "Page Third Role" });
        const targets = [firstTarget, secondTarget, thirdTarget];

        await this.setCreatedAt(targets, createdAt);
        await Promise.all(
            targets.map((target) =>
                this.createRoleDelegationPolicy({
                    delegator: delegatorRole,
                    depthLimit: 0,
                    target,
                    realm,
                }),
            ),
        );

        await this.createAccountRoleAssignment({ realm, role: delegatorRole, account });

        return {
            expectedOrderedCodes: targets.sort((left, right) => left.id.localeCompare(right.id)).map(({ code }) => code),
            account,
            realm,
        };
    }

    /**
     * Builds a revoked delegator assignment to verify delegation lists ignore inactive grants.
     */
    public async delegableRevokedScenario(): Fixtures.Role.DelegableRevokedScenario.Result {
        const account = randomUUID();
        const realm = await this.createRealm({ code: "delegable-revoked", name: "Delegable Revoked" });
        const delegatorRole = await this.createRole({ realm, code: "roles.delegator", name: "Delegator Role" });
        const targetRole = await this.createRole({ realm, code: "roles.target", name: "Target Role" });

        await this.createAccountRoleAssignment({ realm, role: delegatorRole, account, isRevoked: true });
        await this.createRoleDelegationPolicy({
            delegator: delegatorRole,
            target: targetRole,
            depthLimit: 0,
            realm,
        });

        return {
            expectedRoleCodes: [],
            account,
            realm,
        };
    }

    /**
     * Builds an expired delegator assignment to verify delegation lists ignore elapsed grants.
     */
    public async delegableExpiredScenario(): Fixtures.Role.DelegableExpiredScenario.Result {
        const account = randomUUID();
        const realm = await this.createRealm({ code: "delegable-expired", name: "Delegable Expired" });
        const delegatorRole = await this.createRole({ realm, code: "roles.delegator", name: "Delegator Role" });
        const targetRole = await this.createRole({ realm, code: "roles.target", name: "Target Role" });

        await this.createAccountRoleAssignment({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            role: delegatorRole,
            account,
            realm,
        });
        await this.createRoleDelegationPolicy({
            delegator: delegatorRole,
            target: targetRole,
            depthLimit: 0,
            realm,
        });

        return {
            expectedRoleCodes: [],
            account,
            realm,
        };
    }

    /**
     * Builds cross-realm delegation data to verify delegation lists stay scoped to the requested realm.
     */
    public async delegableRealmScenario(): Fixtures.Role.DelegableRealmScenario.Result {
        const account = randomUUID();
        const realm = await this.createRealm({ code: "delegable-realm", name: "Delegable Realm" });
        const foreignRealm = await this.createRealm({ code: "delegable-foreign", name: "Foreign Delegable Realm" });
        const foreignDelegatorRole = await this.createRole({
            realm: foreignRealm,
            code: "roles.foreign-delegator",
            name: "Foreign Delegator Role",
        });
        const targetRole = await this.createRole({ realm, code: "roles.target", name: "Target Role" });

        await this.createAccountRoleAssignment({ realm: foreignRealm, role: foreignDelegatorRole, account });
        await this.createRoleDelegationPolicy({
            realm: foreignRealm,
            delegator: foreignDelegatorRole,
            target: targetRole,
            depthLimit: 0,
        });

        return {
            expectedRoleCodes: [],
            account,
            realm,
        };
    }

    /**
     * Builds role assignments and closure paths to verify an account's effective role set.
     */
    public async effectiveScenario(): Fixtures.Role.EffectiveScenario.Result {
        const account = randomUUID();
        const realm = await this.createRealm({ code: "effective-roles", name: "Effective Roles" });
        const foreignRealm = await this.createRealm({ code: "effective-roles-foreign", name: "Foreign Effective Roles" });
        const rootRole = await this.createRole({ realm, code: "roles.root", name: "Root Role" });
        const parentRole = await this.createRole({ realm, code: "roles.parent", name: "Parent Role" });
        const childRole = await this.createRole({ realm, code: "roles.child", name: "Child Role" });
        const unrelatedRole = await this.createRole({ realm, code: "roles.unrelated", name: "Unrelated Role" });
        const expiredRole = await this.createRole({ realm, code: "roles.expired", name: "Expired Role" });
        const foreignRole = await this.createRole({ realm: foreignRealm, code: "roles.foreign", name: "Foreign Role" });

        await this.createRoleClosure({ realm, ancestor: rootRole, descendant: parentRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: parentRole, descendant: childRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: rootRole, descendant: childRole, depth: 2 });
        await this.createRoleClosure({ realm, ancestor: foreignRole, descendant: childRole, depth: 1 });
        await this.createAccountRoleAssignment({ realm, role: childRole, account });
        await this.createAccountRoleAssignment({ realm, role: unrelatedRole, account, isRevoked: true });
        await this.createAccountRoleAssignment({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            role: expiredRole,
            account,
            realm,
        });

        return {
            expectedRoleCodes: ["roles.child", "roles.parent", "roles.root"],
            account,
            realm,
        };
    }

    /**
     * Builds effective roles with equal creation timestamps to verify stable page boundaries.
     */
    public async effectivePageScenario(): Fixtures.Role.EffectivePageScenario.Result {
        const account = randomUUID();
        const createdAt = new Date("2026-01-01T00:00:00.000Z");
        const realm = await this.createRealm({ code: "effective-page", name: "Effective Page" });
        const firstRole = await this.createRole({ realm, code: "roles.page-first", name: "Page First Role" });
        const secondRole = await this.createRole({ realm, code: "roles.page-second", name: "Page Second Role" });
        const thirdRole = await this.createRole({ realm, code: "roles.page-third", name: "Page Third Role" });
        const roles = [firstRole, secondRole, thirdRole];

        await this.setCreatedAt(roles, createdAt);
        await Promise.all(roles.map((role) => this.createAccountRoleAssignment({ realm, role, account })));

        return {
            expectedOrderedCodes: roles.sort((left, right) => left.id.localeCompare(right.id)).map(({ code }) => code),
            account,
            realm,
        };
    }

    /**
     * Builds a three-level role tree to verify hierarchy graph, ancestor, and descendant queries.
     */
    public async hierarchyScenario(): Fixtures.Role.HierarchyScenario.Result {
        const realm = await this.createRealm({ code: "role-hierarchy", name: "Role Hierarchy" });
        const rootRole = await this.createRole({ realm, code: "roles.root", name: "Root Role" });
        const parentRole = await this.createRole({ realm, code: "roles.parent", name: "Parent Role" });
        const childRole = await this.createRole({ realm, code: "roles.child", name: "Child Role" });

        await this.createRoleClosure({ realm, ancestor: rootRole, descendant: parentRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: parentRole, descendant: childRole, depth: 1 });
        await this.createRoleClosure({ realm, ancestor: rootRole, descendant: childRole, depth: 2 });

        return {
            expectedDescendantCodes: ["roles.child", "roles.parent", "roles.root"],
            expectedAncestorCodes: ["roles.child", "roles.parent", "roles.root"],
            expectedDirectDescendantCodes: ["roles.parent"],
            expectedDirectAncestorCodes: ["roles.parent"],
            descendant: childRole,
            expectedGraphEdges: 2,
            expectedGraphNodes: 3,
            root: rootRole,
            realm,
        };
    }

    /**
     * Builds roles including a revoked one to verify all rows occupy the configured per-realm role limit.
     */
    public async limitScenario(): Fixtures.Role.LimitScenario.Result {
        const realm = await this.createRealm({ code: "role-limit", name: "Role Limit" });

        await this.createRole({ realm, code: "limits.first", name: "First Limit Role" });
        await this.createRole({ realm, code: "limits.second", name: "Second Limit Role" });
        await this.createRole({ realm, code: "limits.revoked", name: "Revoked Limit Role", isRevoked: true });

        return {
            expectedCountOneResult: true,
            expectedCountTwoResult: true,
            realm,
        };
    }

    /**
     * Builds ordered roles across realms to verify lookup pagination and realm scoping.
     */
    public async lookupScenario(): Fixtures.Role.LookupScenario.Result {
        const realm = await this.createRealm({ code: "role-lookup", name: "Role Lookup" });
        const anotherRealm = await this.createRealm({ code: "role-lookup-other", name: "Other Role Lookup" });

        await this.createRole({ realm, code: "beta", name: "Beta Role" });
        await this.createRole({ realm, code: "alpha", name: "Alpha Role" });
        await this.createRole({ realm, code: "gamma", name: "Gamma Role" });
        await this.createRole({ realm: anotherRealm, code: "external", name: "External Role" });

        return {
            expectedFirstPageCodes: ["alpha", "beta"],
            expectedTotal: 3,
            realm,
        };
    }

    /**
     * Builds searchable roles across realms to verify trigram lookup tie-breakers and realm scoping.
     */
    public async lookupSearchScenario(): Fixtures.Role.LookupSearchScenario.Result {
        const realm = await this.createRealm({ code: "role-lookup-search", name: "Role Lookup Search" });
        const anotherRealm = await this.createRealm({
            code: "role-lookup-search-other",
            name: "Other Role Lookup Search",
        });

        await this.createRole({ realm, code: "alpha-access", name: "Alpha Access" });
        await this.createRole({ realm, code: "access-alpha", name: "Access Alpha" });
        await this.createRole({ realm, code: "billing-audit", name: "Billing Audit" });
        await this.createRole({ realm: anotherRealm, code: "external-alpha", name: "Alpha Access" });

        return {
            expectedCodes: ["access-alpha", "alpha-access"],
            term: "Alpha Access",
            realm,
        };
    }
}
