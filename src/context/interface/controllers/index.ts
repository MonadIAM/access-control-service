import { RolePermissionAssignmentController } from "./role-permission-assignment.controller";
import { AccountRoleAssignmentController } from "./account-role-assignment.controller";
import { RoleDelegationPolicyController } from "./role-delegation-policy.controller";
import { RoleConflictMemberController } from "./role-conflict-member.controller";
import { PermissionOverrideController } from "./permission-override.controller";
import { RoleConflictGroupController } from "./role-conflict-group.controller";
import { PermissionController } from "./permission.controller";
import { ChangeLogController } from "./change-log.controller";
import { AuditLogController } from "./audit-log.controller";
import { RealmController } from "./realm.controller";
import { RoleController } from "./role.controller";

export const CONTROLLERS = [
    RolePermissionAssignmentController,
    AccountRoleAssignmentController,
    RoleDelegationPolicyController,
    RoleConflictMemberController,
    PermissionOverrideController,
    RoleConflictGroupController,
    PermissionController,
    ChangeLogController,
    AuditLogController,
    RealmController,
    RoleController,
];

export {
    RolePermissionAssignmentController,
    AccountRoleAssignmentController,
    RoleDelegationPolicyController,
    RoleConflictMemberController,
    PermissionOverrideController,
    RoleConflictGroupController,
    PermissionController,
    ChangeLogController,
    AuditLogController,
    RealmController,
    RoleController,
};
