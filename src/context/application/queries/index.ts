import { ClassProvider } from "@nestjs/common";

import { RolePermissionAssignmentQueries } from "./role-permission-assignment.queries";
import { AccountRoleAssignmentQueries } from "./account-role-assignment.queries";
import { RoleDelegationPolicyQueries } from "./role-delegation-policy.queries";
import { RoleConflictMemberQueries } from "./role-conflict-member.queries";
import { PermissionOverrideQueries } from "./permission-override.queries";
import { RoleConflictGroupQueries } from "./role-conflict-group.queries";
import { PermissionQueries } from "./permission.queries";
import { ChangeLogQueries } from "./change-log.queries";
import { AuditLogQueries } from "./audit-log.queries";
import { RealmQueries } from "./realm.queries";
import { RoleQueries } from "./role.queries";

export const ROLE_PERMISSION_ASSIGNMENT_QUERIES = Symbol("Queries.RolePermissionAssignment.Contract");
export const ACCOUNT_ROLE_ASSIGNMENT_QUERIES = Symbol("Queries.AccountRoleAssignment.Contract");
export const ROLE_DELEGATION_POLICY_QUERIES = Symbol("Queries.RoleDelegationPolicy.Contract");
export const ROLE_CONFLICT_MEMBER_QUERIES = Symbol("Queries.RoleConflictMember.Contract");
export const PERMISSION_OVERRIDE_QUERIES = Symbol("Queries.PermissionOverride.Contract");
export const ROLE_CONFLICT_GROUP_QUERIES = Symbol("Queries.RoleConflictGroup.Contract");
export const PERMISSION_QUERIES = Symbol("Queries.Permission.Contract");
export const CHANGE_LOG_QUERIES = Symbol("Queries.ChangeLog.Contract");
export const AUDIT_LOG_QUERIES = Symbol("Queries.AuditLog.Contract");
export const REALM_QUERIES = Symbol("Queries.Realm.Contract");
export const ROLE_QUERIES = Symbol("Queries.Role.Contract");

export const QUERIES: ClassProvider[] = [
    {
        provide: ROLE_PERMISSION_ASSIGNMENT_QUERIES,
        useClass: RolePermissionAssignmentQueries,
    },
    {
        provide: ACCOUNT_ROLE_ASSIGNMENT_QUERIES,
        useClass: AccountRoleAssignmentQueries,
    },
    {
        provide: ROLE_DELEGATION_POLICY_QUERIES,
        useClass: RoleDelegationPolicyQueries,
    },
    {
        provide: ROLE_CONFLICT_MEMBER_QUERIES,
        useClass: RoleConflictMemberQueries,
    },
    {
        provide: PERMISSION_OVERRIDE_QUERIES,
        useClass: PermissionOverrideQueries,
    },
    {
        provide: ROLE_CONFLICT_GROUP_QUERIES,
        useClass: RoleConflictGroupQueries,
    },
    {
        provide: PERMISSION_QUERIES,
        useClass: PermissionQueries,
    },
    {
        provide: CHANGE_LOG_QUERIES,
        useClass: ChangeLogQueries,
    },
    {
        provide: AUDIT_LOG_QUERIES,
        useClass: AuditLogQueries,
    },
    {
        provide: REALM_QUERIES,
        useClass: RealmQueries,
    },
    {
        provide: ROLE_QUERIES,
        useClass: RoleQueries,
    },
];
