import { Provider } from "@nestjs/common";

import { RolePermissionAssignmentOperation } from "./role-permission-assignment.operation";
import { AccountRoleAssignmentOperation } from "./account-role-assignment.operation";
import { RoleDelegationPolicyOperation } from "./role-delegation-policy.operation";
import { RoleConflictMemberOperation } from "./role-conflict-member.operation";
import { PermissionOverrideOperation } from "./permission-override.operation";
import { RoleConflictGroupOperation } from "./role-conflict-group.operation";
import { PermissionOperation } from "./permission.operation";
import { RealmOperation } from "./realm.operation";
import { RoleOperation } from "./role.operation";

export const ROLE_PERMISSION_ASSIGNMENT_OPERATION = Symbol("Operations.RolePermissionAssignment.Contract");
export const ACCOUNT_ROLE_ASSIGNMENT_OPERATION = Symbol("Operations.AccountRoleAssignment.Contract");
export const ROLE_DELEGATION_POLICY_OPERATION = Symbol("Operations.RoleDelegationPolicy.Contract");
export const ROLE_CONFLICT_MEMBER_OPERATION = Symbol("Operations.RoleConflictMember.Contract");
export const PERMISSION_OVERRIDE_OPERATION = Symbol("Operations.PermissionOverride.Contract");
export const ROLE_CONFLICT_GROUP_OPERATION = Symbol("Operations.RoleConflictGroup.Contract");
export const PERMISSION_OPERATION = Symbol("Operations.Permission.Contract");
export const REALM_OPERATION = Symbol("Operations.Realm.Contract");
export const ROLE_OPERATION = Symbol("Operations.Role.Contract");

export const OPERATIONS: Provider[] = [
    {
        provide: ROLE_PERMISSION_ASSIGNMENT_OPERATION,
        useClass: RolePermissionAssignmentOperation,
    },
    {
        provide: ACCOUNT_ROLE_ASSIGNMENT_OPERATION,
        useClass: AccountRoleAssignmentOperation,
    },
    {
        provide: ROLE_DELEGATION_POLICY_OPERATION,
        useClass: RoleDelegationPolicyOperation,
    },
    {
        provide: ROLE_CONFLICT_MEMBER_OPERATION,
        useClass: RoleConflictMemberOperation,
    },
    {
        provide: PERMISSION_OVERRIDE_OPERATION,
        useClass: PermissionOverrideOperation,
    },
    {
        provide: ROLE_CONFLICT_GROUP_OPERATION,
        useClass: RoleConflictGroupOperation,
    },
    {
        provide: PERMISSION_OPERATION,
        useClass: PermissionOperation,
    },
    {
        provide: REALM_OPERATION,
        useClass: RealmOperation,
    },
    {
        provide: ROLE_OPERATION,
        useClass: RoleOperation,
    },
];
