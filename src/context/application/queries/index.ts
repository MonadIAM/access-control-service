import { Provider } from "@nestjs/common";

import { RolePermissionAssignmentQueries } from "./role-permission-assignment.queries";
import { AccountRoleAssignmentQueries } from "./account-role-assignment.query";
import { RoleDelegationPolicyQueries } from "./role-delegation-policy.queries";
import { RoleConflictMemberQueries } from "./role-conflict-member.queries";
import { PermissionOverrideQueries } from "./permission-override.queries";
import { RoleConflictGroupQueries } from "./role-conflict-group.queries";
import { PermissionQueries } from "./permission.queries";
import { ChangeLogQueries } from "./change-log.queries";
import { AuditLogQueries } from "./audit-log.queries";
import { RealmQueries } from "./realm.queries";
import { RoleQueries } from "./role.queries";
import {
    ROLE_PERMISSION_ASSIGNMENT_QUERIES,
    ACCOUNT_ROLE_ASSIGNMENT_QUERIES,
    ROLE_DELEGATION_POLICY_QUERIES,
    ROLE_CONFLICT_MEMBER_QUERIES,
    PERMISSION_OVERRIDE_QUERIES,
    ROLE_CONFLICT_GROUP_QUERIES,
    PERMISSION_QUERIES,
    CHANGE_LOG_QUERIES,
    AUDIT_LOG_QUERIES,
    REALM_QUERIES,
    ROLE_QUERIES,
} from "./tokens";

export const QUERIES: Provider[] = [
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

export {
    ROLE_PERMISSION_ASSIGNMENT_QUERIES,
    ACCOUNT_ROLE_ASSIGNMENT_QUERIES,
    ROLE_DELEGATION_POLICY_QUERIES,
    ROLE_CONFLICT_MEMBER_QUERIES,
    PERMISSION_OVERRIDE_QUERIES,
    ROLE_CONFLICT_GROUP_QUERIES,
    PERMISSION_QUERIES,
    CHANGE_LOG_QUERIES,
    AUDIT_LOG_QUERIES,
    REALM_QUERIES,
    ROLE_QUERIES,
};
