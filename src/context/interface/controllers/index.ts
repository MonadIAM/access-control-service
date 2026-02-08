import { RolePermissionMatrixController } from "./role-permission-matrix.controller";
import { PermissionOverrideController } from "./permission-override.controller";
import { AccountRoleMatrixController } from "./account-role-matrix.controller";
import { PermissionController } from "./permission.controller";
import { RealmController } from "./realm.controller";
import { RoleController } from "./role.controller";

export const CONTROLLERS = [
    RolePermissionMatrixController,
    PermissionOverrideController,
    AccountRoleMatrixController,
    PermissionController,
    RealmController,
    RoleController,
];

export {
    RolePermissionMatrixController,
    PermissionOverrideController,
    AccountRoleMatrixController,
    PermissionController,
    RealmController,
    RoleController,
};
