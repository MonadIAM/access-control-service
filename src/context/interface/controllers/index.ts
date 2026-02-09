import { RolePermissionMatrixController } from "./role-permission-matrix.controller";
import { RoleDelegationPolicyController } from "./role-delegation-policy.controller";
import { RoleConflictMemberController } from "./role-conflict-member.controller";
import { PermissionOverrideController } from "./permission-override.controller";
import { AccountRoleMatrixController } from "./account-role-matrix.controller";
import { RoleConflictGroupController } from "./role-conflict-group.controller";
import { AuditJournalController } from "./audit-journal.controller";
import { PermissionController } from "./permission.controller";
import { RealmController } from "./realm.controller";
import { RoleController } from "./role.controller";

export const CONTROLLERS = [
    RolePermissionMatrixController,
    RoleDelegationPolicyController,
    RoleConflictMemberController,
    PermissionOverrideController,
    AccountRoleMatrixController,
    RoleConflictGroupController,
    AuditJournalController,
    PermissionController,
    RealmController,
    RoleController,
];

export {
    RolePermissionMatrixController,
    RoleDelegationPolicyController,
    RoleConflictMemberController,
    PermissionOverrideController,
    AccountRoleMatrixController,
    RoleConflictGroupController,
    AuditJournalController,
    PermissionController,
    RealmController,
    RoleController,
};
