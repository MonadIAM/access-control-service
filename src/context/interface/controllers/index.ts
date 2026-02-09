import { RolePermissionMatrixController } from "./role-permission-matrix.controller";
import { RoleDelegationPolicyController } from "./role-delegation-policy.controller";
import { PermissionOverrideController } from "./permission-override.controller";
import { AccountRoleMatrixController } from "./account-role-matrix.controller";
import { RoleConflictGroupController } from "./role-conflict-group.controller";
import { PermissionController } from "./permission.controller";
import { RealmController } from "./realm.controller";
import { RoleController } from "./role.controller";

export const CONTROLLERS = [
    RolePermissionMatrixController,
    RoleDelegationPolicyController,
    PermissionOverrideController,
    AccountRoleMatrixController,
    RoleConflictGroupController,
    PermissionController,
    RealmController,
    RoleController,
];

export {
    RolePermissionMatrixController,
    RoleDelegationPolicyController,
    PermissionOverrideController,
    AccountRoleMatrixController,
    RoleConflictGroupController,
    PermissionController,
    RealmController,
    RoleController,
};
