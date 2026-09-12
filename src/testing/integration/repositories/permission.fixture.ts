import { randomUUID } from "node:crypto";

import { PermissionOverrideEffect } from "~context/enums";

import { CoreFixture } from "./core.fixture";

export class PermissionFixture extends CoreFixture implements Fixtures.Permission.Contract {
    /**
     * Builds a role hierarchy where inherited grants and account-level overrides form the effective permission set.
     */
    public async inheritedScenario(): Fixtures.Permission.InheritedScenario.Result {
        const account = randomUUID();
        const realm = await this.createRealm({ code: "main", name: "Main Realm" });
        const foreignRealm = await this.createRealm({ code: "foreign", name: "Foreign Realm" });

        const parentRole = await this.createRole({ realm, code: "roles.parent", name: "Parent Role" });
        const childRole = await this.createRole({ realm, code: "roles.child", name: "Child Role" });
        const unrelatedRole = await this.createRole({ realm, code: "roles.unrelated", name: "Unrelated Role" });
        const expiredRole = await this.createRole({ realm, code: "roles.expired", name: "Expired Role" });

        await this.createRoleClosure({ realm, ancestor: parentRole, descendant: childRole, depth: 1 });

        const inheritedPermission = await this.createPermission({
            code: "documents.read",
            name: "Read Documents",
            realm,
        });
        const directPermission = await this.createPermission({
            code: "documents.write",
            name: "Write Documents",
            realm,
        });
        const deniedPermission = await this.createPermission({
            code: "documents.delete",
            name: "Delete Documents",
            realm,
        });
        const overridePermission = await this.createPermission({
            code: "reports.export",
            name: "Export Reports",
            realm,
        });
        const unrelatedPermission = await this.createPermission({
            code: "billing.manage",
            name: "Manage Billing",
            realm,
        });
        const expiredAssignmentPermission = await this.createPermission({
            code: "expired.assignment",
            name: "Expired Assignment Permission",
            realm,
        });
        const expiredAllowPermission = await this.createPermission({
            code: "expired.allow",
            name: "Expired Allow Permission",
            realm,
        });
        const foreignPermission = await this.createPermission({
            code: "foreign.permission",
            name: "Foreign Permission",
            realm: foreignRealm,
        });

        await this.createRolePermissionAssignment({ realm, role: parentRole, permission: inheritedPermission });
        await this.createRolePermissionAssignment({ realm, role: childRole, permission: directPermission });
        await this.createRolePermissionAssignment({ realm, role: childRole, permission: deniedPermission });
        await this.createRolePermissionAssignment({ realm, role: unrelatedRole, permission: unrelatedPermission });
        await this.createRolePermissionAssignment({ realm, role: expiredRole, permission: expiredAssignmentPermission });
        await this.createRolePermissionAssignment({ realm, role: childRole, permission: foreignPermission });
        await this.createAccountRoleAssignment({ realm, role: childRole, account });
        await this.createAccountRoleAssignment({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            role: expiredRole,
            account,
            realm,
        });
        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.DENY,
            permission: deniedPermission,
            account,
            realm,
        });
        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.ALLOW,
            permission: overridePermission,
            account,
            realm,
        });
        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.ALLOW,
            permission: foreignPermission,
            account,
            realm,
        });
        await this.createPermissionOverride({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            effect: PermissionOverrideEffect.ALLOW,
            permission: expiredAllowPermission,
            account,
            realm,
        });
        await this.createPermissionOverride({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            effect: PermissionOverrideEffect.DENY,
            permission: directPermission,
            account,
            realm,
        });

        return {
            expectedPermissionCodes: ["documents.read", "documents.write", "reports.export"],
            account,
            realm,
        };
    }

    /**
     * Builds role grants and account-level overrides used to resolve accounts affected by a permission.
     */
    public async accountsScenario(): Fixtures.Permission.AccountsScenario.Result {
        const realm = await this.createRealm({ code: "accounts-by-permissions", name: "Accounts By Permissions" });
        const foreignRealm = await this.createRealm({
            code: "accounts-by-permissions-foreign",
            name: "Foreign Accounts By Permissions",
        });
        const roleAccount = randomUUID();
        const overrideAccount = randomUUID();
        const expiredRoleAccount = randomUUID();
        const expiredOverrideAccount = randomUUID();
        const foreignRoleAccount = randomUUID();
        const foreignOverrideAccount = randomUUID();
        const unrelatedAccount = randomUUID();

        const parentRole = await this.createRole({ realm, code: "roles.parent", name: "Parent Role" });
        const childRole = await this.createRole({ realm, code: "roles.child", name: "Child Role" });
        const unrelatedRole = await this.createRole({ realm, code: "roles.unrelated", name: "Unrelated Role" });

        await this.createRoleClosure({ realm, ancestor: parentRole, descendant: childRole, depth: 1 });

        const permission = await this.createPermission({ realm, code: "reports.read", name: "Read Reports" });
        const unrelatedPermission = await this.createPermission({ realm, code: "billing.read", name: "Read Billing" });

        await this.createRolePermissionAssignment({ realm, role: parentRole, permission });
        await this.createRolePermissionAssignment({ realm, role: unrelatedRole, permission: unrelatedPermission });
        await this.createAccountRoleAssignment({ realm, role: childRole, account: roleAccount });
        await this.createAccountRoleAssignment({ realm: foreignRealm, role: childRole, account: foreignRoleAccount });
        await this.createAccountRoleAssignment({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            account: expiredRoleAccount,
            role: childRole,
            realm,
        });
        await this.createAccountRoleAssignment({ realm, role: unrelatedRole, account: unrelatedAccount });
        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.ALLOW,
            account: overrideAccount,
            permission,
            realm,
        });
        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.ALLOW,
            account: foreignOverrideAccount,
            permission,
            realm: foreignRealm,
        });
        await this.createPermissionOverride({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            effect: PermissionOverrideEffect.ALLOW,
            account: expiredOverrideAccount,
            permission,
            realm,
        });

        return {
            expectedAccounts: [overrideAccount, roleAccount],
            permission,
        };
    }

    /**
     * Builds revoked grants, revoked role assignments, revoked overrides, and deny overrides to verify exclusion rules.
     */
    public async revocationScenario(): Fixtures.Permission.RevocationScenario.Result {
        const account = randomUUID();
        const realm = await this.createRealm({ code: "effective-revocation", name: "Effective Revocation" });

        const activeRole = await this.createRole({ realm, code: "roles.active", name: "Active Role" });
        const revokedRole = await this.createRole({ realm, code: "roles.revoked", name: "Revoked Role" });

        const directPermission = await this.createPermission({
            name: "Direct Active Permission",
            code: "revocation.direct",
            realm,
        });
        const revokedAssignmentPermission = await this.createPermission({
            code: "revocation.assignment-revoked",
            name: "Assignment Revoked Permission",
            realm,
        });
        const roleRevokedPermission = await this.createPermission({
            code: "revocation.role-revoked",
            name: "Role Revoked Permission",
            realm,
        });
        const revokedAllowPermission = await this.createPermission({
            code: "revocation.allow-revoked",
            name: "Revoked Allow Permission",
            realm,
        });
        const deniedPermission = await this.createPermission({
            code: "revocation.denied",
            name: "Denied Permission",
            realm,
        });

        await this.createRolePermissionAssignment({ realm, role: activeRole, permission: directPermission });
        await this.createRolePermissionAssignment({ realm, role: revokedRole, permission: roleRevokedPermission });
        await this.createRolePermissionAssignment({ realm, role: activeRole, permission: deniedPermission });
        await this.createRolePermissionAssignment({
            permission: revokedAssignmentPermission,
            role: activeRole,
            isRevoked: true,
            realm,
        });
        await this.createAccountRoleAssignment({ realm, role: activeRole, account });
        await this.createAccountRoleAssignment({ realm, role: revokedRole, account, isRevoked: true });
        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.ALLOW,
            permission: revokedAllowPermission,
            isRevoked: true,
            account,
            realm,
        });
        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.DENY,
            permission: deniedPermission,
            account,
            realm,
        });

        return {
            expectedPermissionCodes: ["revocation.direct"],
            account,
            realm,
        };
    }

    /**
     * Builds an effective permission set with a search filter and enough rows to verify total count and page size.
     */
    public async filteredPageScenario(): Fixtures.Permission.FilteredPageScenario.Result {
        const account = randomUUID();
        const createdAt = new Date("2026-01-01T00:00:00.000Z");
        const realm = await this.createRealm({ code: "effective-filtered-page", name: "Effective Filtered Page" });
        const role = await this.createRole({ realm, code: "roles.filtered", name: "Filtered Role" });

        await this.createPermission({ realm, code: "billing.audit", name: "Billing Audit" });

        const firstPermission = await this.createPermission({
            code: "documents.alpha",
            name: "Documents Alpha",
            realm,
        });
        const secondPermission = await this.createPermission({
            code: "documents.beta",
            name: "Documents Beta",
            realm,
        });
        const thirdPermission = await this.createPermission({
            code: "documents.gamma",
            name: "Documents Gamma",
            realm,
        });
        const permissions = [firstPermission, secondPermission, thirdPermission];

        await this.setCreatedAt(permissions, createdAt);
        await Promise.all(
            permissions.map((permission) => this.createRolePermissionAssignment({ realm, role, permission })),
        );

        await this.createAccountRoleAssignment({ realm, role, account });

        return {
            expectedOrderedCodes: permissions
                .sort((left, right) => left.id.localeCompare(right.id))
                .map(({ code }) => code),
            expectedPageSize: 2,
            expectedTotal: 3,
            account,
            realm,
        };
    }

    /**
     * Builds permissions including a revoked one to verify all rows occupy the configured per-realm permission limit.
     */
    public async limitScenario(): Fixtures.Permission.LimitScenario.Result {
        const realm = await this.createRealm({ code: "permission-limit", name: "Permission Limit" });

        await this.createPermission({ realm, code: "limits.first", name: "First Limit Permission" });
        await this.createPermission({ realm, code: "limits.second", name: "Second Limit Permission" });
        await this.createPermission({
            realm,
            code: "limits.revoked",
            name: "Revoked Limit Permission",
            isRevoked: true,
        });

        return {
            expectedCountOneResult: true,
            expectedCountTwoResult: true,
            realm,
        };
    }

    /**
     * Builds ordered permissions across realms to verify lookup pagination and realm scoping.
     */
    public async lookupScenario(): Fixtures.Permission.LookupScenario.Result {
        const realm = await this.createRealm({ code: "lookup", name: "Lookup Realm" });
        const anotherRealm = await this.createRealm({ code: "lookup-other", name: "Other Lookup Realm" });

        await this.createPermission({ realm, code: "beta", name: "Beta Permission" });
        await this.createPermission({ realm, code: "alpha", name: "Alpha Permission" });
        await this.createPermission({ realm, code: "gamma", name: "Gamma Permission" });
        await this.createPermission({ realm: anotherRealm, code: "external", name: "External Permission" });

        return {
            expectedFirstPageCodes: ["alpha", "beta"],
            expectedTotal: 3,
            realm,
        };
    }

    /**
     * Builds searchable permissions across realms to verify trigram lookup ranking and realm scoping.
     */
    public async lookupSearchScenario(): Fixtures.Permission.LookupSearchScenario.Result {
        const realm = await this.createRealm({ code: "lookup-search", name: "Lookup Search Realm" });
        const anotherRealm = await this.createRealm({ code: "lookup-search-other", name: "Other Lookup Search Realm" });

        await this.createPermission({ realm, code: "alpha-access", name: "Alpha Access" });
        await this.createPermission({ realm, code: "access-alpha", name: "Access Alpha" });
        await this.createPermission({ realm, code: "billing-audit", name: "Billing Audit" });
        await this.createPermission({ realm: anotherRealm, code: "external-alpha", name: "Alpha Access" });

        return {
            expectedCodes: ["access-alpha", "alpha-access"],
            term: "Alpha Access",
            realm,
        };
    }
}
