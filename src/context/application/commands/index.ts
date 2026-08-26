import { ClassProvider } from "@nestjs/common";

import { RolePermissionAssignmentCommands } from "./role-permission-assignment.commands";
import { AccountRoleAssignmentCommands } from "./account-role-assignment.commands";
import { RoleDelegationPolicyCommands } from "./role-delegation-policy.commands";
import { RoleConflictMemberCommands } from "./role-conflict-member.commands";
import { PermissionOverrideCommands } from "./permission-override.commands";
import { RoleConflictGroupCommands } from "./role-conflict-group.commands";
import { PermissionCommands } from "./permission.commands";
import { MembershipCommands } from "./membership.commands";
import { RealmCommands } from "./realm.commands";
import { RoleCommands } from "./role.commands";

export const ROLE_PERMISSION_ASSIGNMENT_COMMANDS = Symbol("Commands.RolePermissionAssignment.Contract");
export const ACCOUNT_ROLE_ASSIGNMENT_COMMANDS = Symbol("Commands.AccountRoleAssignment.Contract");
export const ROLE_DELEGATION_POLICY_COMMANDS = Symbol("Commands.RoleDelegationPolicy.Contract");
export const ROLE_CONFLICT_MEMBER_COMMANDS = Symbol("Commands.RoleConflictMember.Contract");
export const PERMISSION_OVERRIDE_COMMANDS = Symbol("Commands.PermissionOverride.Contract");
export const ROLE_CONFLICT_GROUP_COMMANDS = Symbol("Commands.RoleConflictGroup.Contract");
export const PERMISSION_COMMANDS = Symbol("Commands.Permission.Contract");
export const MEMBERSHIP_COMMANDS = Symbol("Commands.Membership.Contract");
export const REALM_COMMANDS = Symbol("Commands.Realm.Contract");
export const ROLE_COMMANDS = Symbol("Commands.Role.Contract");

export const COMMANDS: ClassProvider[] = [
    {
        provide: ROLE_PERMISSION_ASSIGNMENT_COMMANDS,
        useClass: RolePermissionAssignmentCommands,
    },
    {
        provide: ACCOUNT_ROLE_ASSIGNMENT_COMMANDS,
        useClass: AccountRoleAssignmentCommands,
    },
    {
        provide: ROLE_DELEGATION_POLICY_COMMANDS,
        useClass: RoleDelegationPolicyCommands,
    },
    {
        provide: ROLE_CONFLICT_MEMBER_COMMANDS,
        useClass: RoleConflictMemberCommands,
    },
    {
        provide: PERMISSION_OVERRIDE_COMMANDS,
        useClass: PermissionOverrideCommands,
    },
    {
        provide: ROLE_CONFLICT_GROUP_COMMANDS,
        useClass: RoleConflictGroupCommands,
    },
    {
        provide: PERMISSION_COMMANDS,
        useClass: PermissionCommands,
    },
    {
        provide: MEMBERSHIP_COMMANDS,
        useClass: MembershipCommands,
    },
    {
        provide: REALM_COMMANDS,
        useClass: RealmCommands,
    },
    {
        provide: ROLE_COMMANDS,
        useClass: RoleCommands,
    },
];
