import { CoreFixture } from "./core.fixture";

export class RolePermissionAssignmentFixture extends CoreFixture implements Fixtures.RolePermissionAssignment.Contract {
    /**
     * Builds active, revoked, and additional permission assignments for one role to verify per-role assignment limits.
     */
    public async limitScenario(): Fixtures.RolePermissionAssignment.LimitScenario.Result {
        const realm = await this.createRealm({ code: "role-permission-limit", name: "Role Permission Limit" });
        const role = await this.createRole({ realm, code: "roles.limited", name: "Limited Role" });
        const existingPermission = await this.createPermission({
            code: "permissions.existing",
            name: "Existing Permission",
            realm,
        });
        const overlappingPermission = await this.createPermission({
            code: "permissions.overlapping",
            name: "Overlapping Permission",
            realm,
        });
        const revokedPermission = await this.createPermission({
            code: "permissions.revoked",
            name: "Revoked Permission",
            realm,
        });
        const additionalPermission = await this.createPermission({
            code: "permissions.additional",
            name: "Additional Permission",
            realm,
        });

        await this.createRolePermissionAssignment({ realm, role, permission: existingPermission });
        await this.createRolePermissionAssignment({ realm, role, permission: overlappingPermission });
        await this.createRolePermissionAssignment({ realm, role, permission: revokedPermission, isRevoked: true });

        return {
            expectedOverlappingResult: false,
            expectedAdditionalResult: true,
            role,
            permissions: {
                overlapping: overlappingPermission,
                additional: additionalPermission,
                existing: existingPermission,
                revoked: revokedPermission,
            },
        };
    }
}
