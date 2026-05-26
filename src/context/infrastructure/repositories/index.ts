import { Provider } from "@nestjs/common";

import { RolePermissionAssignmentRepository } from "./role-permission-assignment.repository";
import { AccountRoleAssignmentRepository } from "./account-role-assignment.repository";
import { RoleDelegationPolicyRepository } from "./role-delegation-policy.repository";
import { RoleConflictMemberRepository } from "./role-conflict-member.repository";
import { PermissionOverrideRepository } from "./permission-override.repository";
import { RoleConflictGroupRepository } from "./role-conflict-group.repository";
import { RoleClosureRepository } from "./role-closure.repository";
import { PermissionRepository } from "./permission.repository";
import { ChangeLogRepository } from "./change-log.repository";
import { AuditLogRepository } from "./audit-log.repository";
import { InviteRepository } from "./invite.repository";
import { RealmRepository } from "./realm.repository";
import { RoleRepository } from "./role.repository";
import {
    ROLE_PERMISSION_ASSIGNMENT_REPOSITORY,
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    ROLE_DELEGATION_POLICY_REPOSITORY,
    ROLE_CONFLICT_MEMBER_REPOSITORY,
    PERMISSION_OVERRIDE_REPOSITORY,
    ROLE_CONFLICT_GROUP_REPOSITORY,
    ROLE_CLOSURE_REPOSITORY,
    CHANGE_LOG_REPOSITORY,
    PERMISSION_REPOSITORY,
    AUDIT_LOG_REPOSITORY,
    INVITE_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "./tokens";

export const REPOSITORIES: Provider[] = [
    {
        provide: ROLE_PERMISSION_ASSIGNMENT_REPOSITORY,
        useClass: RolePermissionAssignmentRepository,
    },
    {
        provide: ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
        useClass: AccountRoleAssignmentRepository,
    },
    {
        provide: ROLE_DELEGATION_POLICY_REPOSITORY,
        useClass: RoleDelegationPolicyRepository,
    },
    {
        provide: ROLE_CONFLICT_MEMBER_REPOSITORY,
        useClass: RoleConflictMemberRepository,
    },
    {
        provide: PERMISSION_OVERRIDE_REPOSITORY,
        useClass: PermissionOverrideRepository,
    },
    {
        provide: ROLE_CONFLICT_GROUP_REPOSITORY,
        useClass: RoleConflictGroupRepository,
    },
    {
        provide: ROLE_CLOSURE_REPOSITORY,
        useClass: RoleClosureRepository,
    },
    {
        provide: PERMISSION_REPOSITORY,
        useClass: PermissionRepository,
    },
    {
        provide: CHANGE_LOG_REPOSITORY,
        useClass: ChangeLogRepository,
    },
    {
        provide: AUDIT_LOG_REPOSITORY,
        useClass: AuditLogRepository,
    },
    {
        provide: INVITE_REPOSITORY,
        useClass: InviteRepository,
    },
    {
        provide: REALM_REPOSITORY,
        useClass: RealmRepository,
    },
    {
        provide: ROLE_REPOSITORY,
        useClass: RoleRepository,
    },
];

export {
    ROLE_PERMISSION_ASSIGNMENT_REPOSITORY,
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    ROLE_DELEGATION_POLICY_REPOSITORY,
    ROLE_CONFLICT_MEMBER_REPOSITORY,
    PERMISSION_OVERRIDE_REPOSITORY,
    ROLE_CONFLICT_GROUP_REPOSITORY,
    ROLE_CLOSURE_REPOSITORY,
    CHANGE_LOG_REPOSITORY,
    PERMISSION_REPOSITORY,
    AUDIT_LOG_REPOSITORY,
    INVITE_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
};
