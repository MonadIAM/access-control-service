import { RoleDelegationPolicyRepository } from "./role-delegation-policy.repository";
import { RolePermissionMatrixRepository } from "./role-permission-matrix.repository";
import { RoleConflictMemberRepository } from "./role-conflict-member.repository";
import { PermissionOverrideRepository } from "./permission-override.repository";
import { RoleConflictGroupRepository } from "./role-conflict-group.repository";
import { AccountRoleMatrixRepository } from "./account-role-matrix.repository";
import { AuditJournalRepository } from "./audit-journal.repository";
import { RoleClosureRepository } from "./role-closure.repository";
import { PermissionRepository } from "./permission.repository";
import { RealmRepository } from "./realm.repository";
import { RoleRepository } from "./role.repository";

export const ROLE_DELEGATION_POLICY_REPOSITORY = Symbol("Repositories.RoleDelegationPolicy.Contract");
export const ROLE_PERMISSION_MATRIX_REPOSITORY = Symbol("Repositories.RolePermissionMatrix.Contract");
export const ROLE_CONFLICT_MEMBER_REPOSITORY = Symbol("Repositories.RoleConflictMember.Contract");
export const PERMISSION_OVERRIDE_REPOSITORY = Symbol("Repositories.PermissionOverride.Contract");
export const ROLE_CONFLICT_GROUP_REPOSITORY = Symbol("Repositories.RoleConflictGroup.Contract");
export const ACCOUNT_ROLE_MATRIX_REPOSITORY = Symbol("Repositories.AccountRoleMatrix.Contract");
export const AUDIT_JOURNAL_REPOSITORY = Symbol("Repositories.AuditJournal.Contract");
export const ROLE_CLOSURE_REPOSITORY = Symbol("Repositories.RoleClosure.Contract");
export const PERMISSION_REPOSITORY = Symbol("Repositories.Permission.Contract");
export const REALM_REPOSITORY = Symbol("Repositories.Realm.Contract");
export const ROLE_REPOSITORY = Symbol("Repositories.Role.Contract");

export const REPOSITORIES = [
    {
        provide: ROLE_DELEGATION_POLICY_REPOSITORY,
        useClass: RoleDelegationPolicyRepository,
    },
    {
        provide: ROLE_PERMISSION_MATRIX_REPOSITORY,
        useClass: RolePermissionMatrixRepository,
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
        provide: ACCOUNT_ROLE_MATRIX_REPOSITORY,
        useClass: AccountRoleMatrixRepository,
    },
    {
        provide: AUDIT_JOURNAL_REPOSITORY,
        useClass: AuditJournalRepository,
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
        provide: REALM_REPOSITORY,
        useClass: RealmRepository,
    },
    {
        provide: ROLE_REPOSITORY,
        useClass: RoleRepository,
    },
];
