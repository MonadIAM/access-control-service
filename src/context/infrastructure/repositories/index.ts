import { ClassProvider } from "@nestjs/common";

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
import { RealmRepository } from "./realm.repository";
import { RoleRepository } from "./role.repository";

export const ROLE_PERMISSION_ASSIGNMENT_REPOSITORY = Symbol("Repositories.RolePermissionAssignment.Contract");
export const ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY = Symbol("Repositories.AccountRoleAssignment.Contract");
export const ROLE_DELEGATION_POLICY_REPOSITORY = Symbol("Repositories.RoleDelegationPolicy.Contract");
export const ROLE_CONFLICT_MEMBER_REPOSITORY = Symbol("Repositories.RoleConflictMember.Contract");
export const PERMISSION_OVERRIDE_REPOSITORY = Symbol("Repositories.PermissionOverride.Contract");
export const ROLE_CONFLICT_GROUP_REPOSITORY = Symbol("Repositories.RoleConflictGroup.Contract");
export const ROLE_CLOSURE_REPOSITORY = Symbol("Repositories.RoleClosure.Contract");
export const PERMISSION_REPOSITORY = Symbol("Repositories.Permission.Contract");
export const CHANGE_LOG_REPOSITORY = Symbol("Repositories.ChangeLog.Contract");
export const AUDIT_LOG_REPOSITORY = Symbol("Repositories.AuditLog.Contract");
export const REALM_REPOSITORY = Symbol("Repositories.Realm.Contract");
export const ROLE_REPOSITORY = Symbol("Repositories.Role.Contract");

export const REPOSITORIES: ClassProvider[] = [
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
        provide: REALM_REPOSITORY,
        useClass: RealmRepository,
    },
    {
        provide: ROLE_REPOSITORY,
        useClass: RoleRepository,
    },
];
