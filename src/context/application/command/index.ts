import { Provider } from "@nestjs/common";

import { RolePermissionAssignmentCommand } from "./role-permission-assignment.command";
import { AccountRoleAssignmentCommand } from "./account-role-assignment.command";
import { RoleDelegationPolicyCommand } from "./role-delegation-policy.command";
import { RoleConflictMemberCommand } from "./role-conflict-member.command";
import { PermissionOverrideCommand } from "./permission-override.command";
import { RoleConflictGroupCommand } from "./role-conflict-group.command";
import { PermissionCommand } from "./permission.command";
import { RealmCommand } from "./realm.command";
import { RoleCommand } from "./role.command";

export const ROLE_PERMISSION_ASSIGNMENT_COMMAND = Symbol("Commands.RolePermissionAssignment.Contract");
export const ACCOUNT_ROLE_ASSIGNMENT_COMMAND = Symbol("Commands.AccountRoleAssignment.Contract");
export const ROLE_DELEGATION_POLICY_COMMAND = Symbol("Commands.RoleDelegationPolicy.Contract");
export const ROLE_CONFLICT_MEMBER_COMMAND = Symbol("Commands.RoleConflictMember.Contract");
export const PERMISSION_OVERRIDE_COMMAND = Symbol("Commands.PermissionOverride.Contract");
export const ROLE_CONFLICT_GROUP_COMMAND = Symbol("Commands.RoleConflictGroup.Contract");
export const PERMISSION_COMMAND = Symbol("Commands.Permission.Contract");
export const REALM_COMMAND = Symbol("Commands.Realm.Contract");
export const ROLE_COMMAND = Symbol("Commands.Role.Contract");

export const COMMANDS: Provider[] = [
    {
        provide: ROLE_PERMISSION_ASSIGNMENT_COMMAND,
        useClass: RolePermissionAssignmentCommand,
    },
    {
        provide: ACCOUNT_ROLE_ASSIGNMENT_COMMAND,
        useClass: AccountRoleAssignmentCommand,
    },
    {
        provide: ROLE_DELEGATION_POLICY_COMMAND,
        useClass: RoleDelegationPolicyCommand,
    },
    {
        provide: ROLE_CONFLICT_MEMBER_COMMAND,
        useClass: RoleConflictMemberCommand,
    },
    {
        provide: PERMISSION_OVERRIDE_COMMAND,
        useClass: PermissionOverrideCommand,
    },
    {
        provide: ROLE_CONFLICT_GROUP_COMMAND,
        useClass: RoleConflictGroupCommand,
    },
    {
        provide: PERMISSION_COMMAND,
        useClass: PermissionCommand,
    },
    {
        provide: REALM_COMMAND,
        useClass: RealmCommand,
    },
    {
        provide: ROLE_COMMAND,
        useClass: RoleCommand,
    },
];
