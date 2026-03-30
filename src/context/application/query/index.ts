import { Provider } from "@nestjs/common";

import { RolePermissionAssignmentQuery } from "./role-permission-assignment.query";
import { AccountRoleAssignmentQuery } from "./account-role-assignment.query";
import { RoleDelegationPolicyQuery } from "./role-delegation-policy.query";
import { RoleConflictMemberQuery } from "./role-conflict-member.query";
import { PermissionOverrideQuery } from "./permission-override.query";
import { RoleConflictGroupQuery } from "./role-conflict-group.query";
import { PermissionQuery } from "./permission.query";
import { ChangeLogQuery } from "./change-log.query";
import { AuditLogQuery } from "./audit-log.query";
import { RealmQuery } from "./realm.query";
import { RoleQuery } from "./role.query";

export const ROLE_PERMISSION_ASSIGNMENT_QUERY = Symbol("Queries.RolePermissionAssignment.Contract");
export const ACCOUNT_ROLE_ASSIGNMENT_QUERY = Symbol("Queries.AccountRoleAssignment.Contract");
export const ROLE_DELEGATION_POLICY_QUERY = Symbol("Queries.RoleDelegationPolicy.Contract");
export const ROLE_CONFLICT_MEMBER_QUERY = Symbol("Queries.RoleConflictMember.Contract");
export const PERMISSION_OVERRIDE_QUERY = Symbol("Queries.PermissionOverride.Contract");
export const ROLE_CONFLICT_GROUP_QUERY = Symbol("Queries.RoleConflictGroup.Contract");
export const PERMISSION_QUERY = Symbol("Queries.Permission.Contract");
export const CHANGE_LOG_QUERY = Symbol("Queries.ChangeLog.Contract");
export const AUDIT_LOG_QUERY = Symbol("Queries.AuditLog.Contract");
export const REALM_QUERY = Symbol("Queries.Realm.Contract");
export const ROLE_QUERY = Symbol("Queries.Role.Contract");

export const QUERIES: Provider[] = [
    {
        provide: ROLE_PERMISSION_ASSIGNMENT_QUERY,
        useClass: RolePermissionAssignmentQuery,
    },
    {
        provide: ACCOUNT_ROLE_ASSIGNMENT_QUERY,
        useClass: AccountRoleAssignmentQuery,
    },
    {
        provide: ROLE_DELEGATION_POLICY_QUERY,
        useClass: RoleDelegationPolicyQuery,
    },
    {
        provide: ROLE_CONFLICT_MEMBER_QUERY,
        useClass: RoleConflictMemberQuery,
    },
    {
        provide: PERMISSION_OVERRIDE_QUERY,
        useClass: PermissionOverrideQuery,
    },
    {
        provide: ROLE_CONFLICT_GROUP_QUERY,
        useClass: RoleConflictGroupQuery,
    },
    {
        provide: PERMISSION_QUERY,
        useClass: PermissionQuery,
    },
    {
        provide: CHANGE_LOG_QUERY,
        useClass: ChangeLogQuery,
    },
    {
        provide: AUDIT_LOG_QUERY,
        useClass: AuditLogQuery,
    },
    {
        provide: REALM_QUERY,
        useClass: RealmQuery,
    },
    {
        provide: ROLE_QUERY,
        useClass: RoleQuery,
    },
];
