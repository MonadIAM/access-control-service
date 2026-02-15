import { RolePermissionAssignmentController } from "./role-permission-assignment.controller";
import { AccountRoleAssignmentController } from "./account-role-assignment.controller";
import { RoleDelegationPolicyController } from "./role-delegation-policy.controller";
import { RoleConflictMemberController } from "./role-conflict-member.controller";
import { PermissionOverrideController } from "./permission-override.controller";
import { RoleConflictGroupController } from "./role-conflict-group.controller";
import { AuditJournalController } from "./audit-journal.controller";
import { PermissionController } from "./permission.controller";
import { RealmController } from "./realm.controller";
import { RoleController } from "./role.controller";

export const CONTROLLERS = [
    RolePermissionAssignmentController,
    AccountRoleAssignmentController,
    RoleDelegationPolicyController,
    RoleConflictMemberController,
    PermissionOverrideController,
    RoleConflictGroupController,
    AuditJournalController,
    PermissionController,
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
    AuditJournalController,
    PermissionController,
    RealmController,
    RoleController,
};
