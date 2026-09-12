import { randomUUID } from "node:crypto";

import { CoreFixture } from "./core.fixture";

export class RoleConflictGroupFixture extends CoreFixture implements Fixtures.RoleConflictGroup.Contract {
    /**
     * Builds accounts with active and revoked assignments to verify detection of conflict-rule violations.
     */
    public async violatingAccountsScenario(): Fixtures.RoleConflictGroup.ViolatingAccountsScenario.Result {
        const realm = await this.createRealm({ code: "accounts-violating-rule", name: "Accounts Violating Rule" });
        const foreignRealm = await this.createRealm({
            code: "accounts-violating-rule-foreign",
            name: "Foreign Accounts Violating Rule",
        });
        const firstRole = await this.createRole({ realm, code: "roles.first", name: "First Role" });
        const secondRole = await this.createRole({ realm, code: "roles.second", name: "Second Role" });
        const foreignFirstRole = await this.createRole({
            realm: foreignRealm,
            code: "roles.foreign-first",
            name: "Foreign First Role",
        });
        const foreignSecondRole = await this.createRole({
            code: "roles.foreign-second",
            name: "Foreign Second Role",
            realm: foreignRealm,
        });
        const violatingAccount = randomUUID();
        const cleanAccount = randomUUID();
        const revokedOnlyAccount = randomUUID();
        const expiredOnlyAccount = randomUUID();
        const foreignAccount = randomUUID();

        await this.createAccountRoleAssignment({ realm, role: firstRole, account: violatingAccount });
        await this.createAccountRoleAssignment({ realm, role: secondRole, account: violatingAccount });
        await this.createAccountRoleAssignment({ realm, role: firstRole, account: cleanAccount });
        await this.createAccountRoleAssignment({ realm, role: firstRole, account: revokedOnlyAccount });
        await this.createAccountRoleAssignment({ realm, role: secondRole, account: revokedOnlyAccount, isRevoked: true });
        await this.createAccountRoleAssignment({ realm, role: firstRole, account: expiredOnlyAccount });
        await this.createAccountRoleAssignment({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            account: expiredOnlyAccount,
            role: secondRole,
            realm,
        });
        await this.createAccountRoleAssignment({ realm, role: foreignFirstRole, account: foreignAccount });
        await this.createAccountRoleAssignment({ realm, role: foreignSecondRole, account: foreignAccount });

        return {
            roles: [firstRole, secondRole, foreignFirstRole, foreignSecondRole],
            expectedAccounts: [violatingAccount],
            maxAllowed: 1,
            realm,
        };
    }

    /**
     * Builds an expired existing assignment and candidate role to verify elapsed grants do not violate conflict groups.
     */
    public async violatedExpiredScenario(): Fixtures.RoleConflictGroup.ViolatedExpiredScenario.Result {
        const realm = await this.createRealm({
            code: "groups-violated-expired",
            name: "Groups Violated Expired",
        });
        const account = randomUUID();
        const expiredRole = await this.createRole({ realm, code: "roles.expired", name: "Expired Role" });
        const candidateRole = await this.createRole({ realm, code: "roles.candidate", name: "Candidate Role" });
        const group = await this.createRoleConflictGroup({
            code: "conflicts.expired",
            name: "Expired Conflict",
            maxAllowed: 1,
            realm,
        });

        await this.createRoleConflictMember({ group, role: expiredRole });
        await this.createRoleConflictMember({ group, role: candidateRole });
        await this.createAccountRoleAssignment({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            role: expiredRole,
            account,
            realm,
        });

        return {
            candidateRoles: [candidateRole],
            expectedGroupCodes: [],
            account,
            realm,
        };
    }

    /**
     * Builds assigned and candidate roles that violate active conflict groups for one account.
     */
    public async violatedGroupsScenario(): Fixtures.RoleConflictGroup.ViolatedGroupsScenario.Result {
        const realm = await this.createRealm({ code: "groups-violated-by-account", name: "Groups Violated By Account" });
        const foreignRealm = await this.createRealm({
            code: "groups-violated-by-account-foreign",
            name: "Foreign Groups Violated By Account",
        });
        const account = randomUUID();
        const assignedRole = await this.createRole({ realm, code: "roles.assigned", name: "Assigned Role" });
        const candidateRole = await this.createRole({ realm, code: "roles.candidate", name: "Candidate Role" });
        const unrelatedRole = await this.createRole({ realm, code: "roles.unrelated", name: "Unrelated Role" });
        const foreignAssignedRole = await this.createRole({
            realm: foreignRealm,
            code: "roles.foreign-assigned",
            name: "Foreign Assigned Role",
        });
        const foreignCandidateRole = await this.createRole({
            realm: foreignRealm,
            code: "roles.foreign-candidate",
            name: "Foreign Candidate Role",
        });
        const primaryGroup = await this.createRoleConflictGroup({
            code: "conflicts.primary",
            name: "Primary Conflict",
            maxAllowed: 1,
            realm,
        });
        const foreignMemberGroup = await this.createRoleConflictGroup({
            code: "conflicts.foreign-members",
            name: "Foreign Member Conflict",
            maxAllowed: 1,
            realm,
        });
        const revokedGroup = await this.createRoleConflictGroup({
            code: "conflicts.revoked",
            name: "Revoked Conflict",
            isRevoked: true,
            maxAllowed: 1,
            realm,
        });
        const unrelatedGroup = await this.createRoleConflictGroup({
            code: "conflicts.unrelated",
            name: "Unrelated Conflict",
            maxAllowed: 1,
            realm,
        });

        await this.createRoleConflictMember({ group: primaryGroup, role: assignedRole });
        await this.createRoleConflictMember({ group: primaryGroup, role: candidateRole });
        await this.createRoleConflictMember({ group: revokedGroup, role: assignedRole });
        await this.createRoleConflictMember({ group: revokedGroup, role: candidateRole });
        await this.createRoleConflictMember({ group: unrelatedGroup, role: assignedRole });
        await this.createRoleConflictMember({ group: unrelatedGroup, role: unrelatedRole });
        await this.createRoleConflictMember({ group: foreignMemberGroup, role: foreignAssignedRole });
        await this.createRoleConflictMember({ group: foreignMemberGroup, role: foreignCandidateRole });
        await this.createAccountRoleAssignment({ realm, role: assignedRole, account });
        await this.createAccountRoleAssignment({ realm, role: foreignAssignedRole, account });

        return {
            candidateRoles: [candidateRole, foreignCandidateRole],
            expectedGroupCodes: ["conflicts.primary"],
            account,
            realm,
        };
    }

    /**
     * Builds a group where an expired assignment is required for violation to verify elapsed grants are ignored.
     */
    public async violatingGroupsExpiredScenario(): Fixtures.RoleConflictGroup.ViolatingGroupsExpiredScenario.Result {
        const realm = await this.createRealm({
            code: "groups-with-expired-violations",
            name: "Groups With Expired Violations",
        });
        const account = randomUUID();
        const firstRole = await this.createRole({ realm, code: "roles.first", name: "First Role" });
        const secondRole = await this.createRole({ realm, code: "roles.second", name: "Second Role" });
        const group = await this.createRoleConflictGroup({
            code: "conflicts.expired",
            name: "Expired Conflict",
            maxAllowed: 1,
            realm,
        });

        await this.createRoleConflictMember({ group, role: firstRole });
        await this.createRoleConflictMember({ group, role: secondRole });
        await this.createAccountRoleAssignment({ realm, role: firstRole, account });
        await this.createAccountRoleAssignment({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            role: secondRole,
            account,
            realm,
        });

        return {
            expectedResult: false,
            groups: [group],
            realm,
        };
    }

    /**
     * Builds a group violated only by foreign-realm roles to verify configured group checks stay realm-scoped.
     */
    public async violatingGroupsRealmScenario(): Fixtures.RoleConflictGroup.ViolatingGroupsRealmScenario.Result {
        const realm = await this.createRealm({
            code: "groups-with-foreign-role-violations",
            name: "Groups With Foreign Role Violations",
        });
        const foreignRealm = await this.createRealm({
            code: "groups-with-foreign-role-violations-foreign",
            name: "Foreign Groups With Foreign Role Violations",
        });
        const account = randomUUID();
        const foreignFirstRole = await this.createRole({
            realm: foreignRealm,
            code: "roles.foreign-first",
            name: "Foreign First Role",
        });
        const foreignSecondRole = await this.createRole({
            realm: foreignRealm,
            code: "roles.foreign-second",
            name: "Foreign Second Role",
        });
        const group = await this.createRoleConflictGroup({
            code: "conflicts.foreign-members",
            name: "Foreign Member Conflict",
            maxAllowed: 1,
            realm,
        });

        await this.createRoleConflictMember({ group, role: foreignFirstRole });
        await this.createRoleConflictMember({ group, role: foreignSecondRole });
        await this.createAccountRoleAssignment({ realm, role: foreignFirstRole, account });
        await this.createAccountRoleAssignment({ realm, role: foreignSecondRole, account });

        return {
            expectedResult: false,
            groups: [group],
            realm,
        };
    }

    /**
     * Builds configured conflict groups with enough assignments to verify boolean violation detection.
     */
    public async violatingGroupsScenario(): Fixtures.RoleConflictGroup.ViolatingGroupsScenario.Result {
        const realm = await this.createRealm({
            code: "groups-with-violating-accounts",
            name: "Groups With Violating Accounts",
        });
        const account = randomUUID();
        const firstRole = await this.createRole({ realm, code: "roles.first", name: "First Role" });
        const secondRole = await this.createRole({ realm, code: "roles.second", name: "Second Role" });
        const group = await this.createRoleConflictGroup({
            code: "conflicts.active",
            name: "Active Conflict",
            maxAllowed: 1,
            realm,
        });

        await this.createRoleConflictMember({ group, role: firstRole });
        await this.createRoleConflictMember({ group, role: secondRole });
        await this.createAccountRoleAssignment({ realm, role: firstRole, account });
        await this.createAccountRoleAssignment({ realm, role: secondRole, account });

        return {
            expectedResult: true,
            groups: [group],
            realm,
        };
    }

    /**
     * Builds active and revoked conflict groups to verify the configured per-realm group limit.
     */
    public async limitScenario(): Fixtures.RoleConflictGroup.LimitScenario.Result {
        const realm = await this.createRealm({ code: "conflict-group-limit", name: "Conflict Group Limit" });

        await this.createRoleConflictGroup({ realm, code: "limits.first", name: "First Limit Group" });
        await this.createRoleConflictGroup({ realm, code: "limits.second", name: "Second Limit Group" });
        await this.createRoleConflictGroup({
            name: "Revoked Limit Group",
            code: "limits.revoked",
            isRevoked: true,
            realm,
        });

        return {
            expectedCountOneResult: false,
            expectedCountTwoResult: true,
            realm,
        };
    }
}
