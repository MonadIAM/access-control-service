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

export const REPOSITORIES = [
    RoleDelegationPolicyRepository,
    RolePermissionMatrixRepository,
    PermissionOverrideRepository,
    RoleConflictMemberRepository,
    RoleConflictGroupRepository,
    AccountRoleMatrixRepository,
    AuditJournalRepository,
    RoleClosureRepository,
    PermissionRepository,
    RealmRepository,
    RoleRepository,
];

export {
    RoleDelegationPolicyRepository,
    RolePermissionMatrixRepository,
    PermissionOverrideRepository,
    RoleConflictMemberRepository,
    RoleConflictGroupRepository,
    AccountRoleMatrixRepository,
    AuditJournalRepository,
    RoleClosureRepository,
    PermissionRepository,
    RealmRepository,
    RoleRepository,
};
