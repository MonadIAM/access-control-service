import { ClassProvider } from "@nestjs/common";

import { RolePermissionAssignmentService } from "./role-permission-assignment.service";
import { AccountRoleAssignmentService } from "./account-role-assignment.service";
import { RoleDelegationPolicyService } from "./role-delegation-policy.service";
import { RoleConflictMemberService } from "./role-conflict-member.service";
import { PermissionOverrideService } from "./permission-override.service";
import { RoleConflictGroupService } from "./role-conflict-group.service";
import { PermissionService } from "./permission.service";
import { ChangeLogService } from "./change-log.service";
import { AuditLogService } from "./audit-log.service";
import { InviteService } from "./invite.service";
import { RealmService } from "./realm.service";
import { RoleService } from "./role.service";
import {
    ROLE_PERMISSION_ASSIGNMENT_SERVICE,
    ACCOUNT_ROLE_ASSIGNMENT_SERVICE,
    ROLE_DELEGATION_POLICY_SERVICE,
    ROLE_CONFLICT_MEMBER_SERVICE,
    PERMISSION_OVERRIDE_SERVICE,
    ROLE_CONFLICT_GROUP_SERVICE,
    PERMISSION_SERVICE,
    CHANGE_LOG_SERVICE,
    AUDIT_LOG_SERVICE,
    INVITE_SERVICE,
    REALM_SERVICE,
    ROLE_SERVICE,
} from "./tokens";

export const DOMAIN_SERVICES: ClassProvider[] = [
    {
        provide: ROLE_PERMISSION_ASSIGNMENT_SERVICE,
        useClass: RolePermissionAssignmentService,
    },
    {
        provide: ACCOUNT_ROLE_ASSIGNMENT_SERVICE,
        useClass: AccountRoleAssignmentService,
    },
    {
        provide: ROLE_DELEGATION_POLICY_SERVICE,
        useClass: RoleDelegationPolicyService,
    },
    {
        provide: ROLE_CONFLICT_MEMBER_SERVICE,
        useClass: RoleConflictMemberService,
    },
    {
        provide: PERMISSION_OVERRIDE_SERVICE,
        useClass: PermissionOverrideService,
    },
    {
        provide: ROLE_CONFLICT_GROUP_SERVICE,
        useClass: RoleConflictGroupService,
    },
    {
        provide: PERMISSION_SERVICE,
        useClass: PermissionService,
    },
    {
        provide: CHANGE_LOG_SERVICE,
        useClass: ChangeLogService,
    },
    {
        provide: AUDIT_LOG_SERVICE,
        useClass: AuditLogService,
    },
    {
        provide: INVITE_SERVICE,
        useClass: InviteService,
    },
    {
        provide: REALM_SERVICE,
        useClass: RealmService,
    },
    {
        provide: ROLE_SERVICE,
        useClass: RoleService,
    },
];

export {
    ROLE_PERMISSION_ASSIGNMENT_SERVICE,
    ACCOUNT_ROLE_ASSIGNMENT_SERVICE,
    ROLE_DELEGATION_POLICY_SERVICE,
    ROLE_CONFLICT_MEMBER_SERVICE,
    PERMISSION_OVERRIDE_SERVICE,
    ROLE_CONFLICT_GROUP_SERVICE,
    PERMISSION_SERVICE,
    CHANGE_LOG_SERVICE,
    AUDIT_LOG_SERVICE,
    INVITE_SERVICE,
    REALM_SERVICE,
    ROLE_SERVICE,
};
