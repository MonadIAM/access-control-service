import { CoreFixture } from "./core.fixture";

export class RoleConflictMemberFixture extends CoreFixture implements Fixtures.RoleConflictMember.Contract {
    /**
     * Builds conflict-group members including a revoked one to verify all rows occupy the configured per-group limit.
     */
    public async limitScenario(): Fixtures.RoleConflictMember.LimitScenario.Result {
        const realm = await this.createRealm({ code: "conflict-member-limit", name: "Conflict Member Limit" });
        const group = await this.createRoleConflictGroup({
            code: "conflicts.limited",
            name: "Limited Conflict",
            realm,
        });
        const firstRole = await this.createRole({ realm, code: "roles.first", name: "First Role" });
        const secondRole = await this.createRole({ realm, code: "roles.second", name: "Second Role" });
        const revokedRole = await this.createRole({ realm, code: "roles.revoked", name: "Revoked Role" });

        await this.createRoleConflictMember({ group, role: firstRole });
        await this.createRoleConflictMember({ group, role: secondRole });
        await this.createRoleConflictMember({ group, role: revokedRole, isRevoked: true });

        return {
            expectedCountOneResult: true,
            expectedCountTwoResult: true,
            group,
        };
    }
}
