import { Provider } from "@nestjs/common";

import { RolePermissionAssignmentCommands } from "./role-permission-assignment.commands";
import { AccountRoleAssignmentCommands } from "./account-role-assignment.commands";
import { RoleDelegationPolicyCommands } from "./role-delegation-policy.commands";
import { RoleConflictMemberCommands } from "./role-conflict-member.commands";
import { PermissionOverrideCommands } from "./permission-override.commands";
import { RoleConflictGroupCommands } from "./role-conflict-group.commands";
import { PermissionCommands } from "./permission.commands";
import { RealmCommands } from "./realm.commands";
import { RoleCommands } from "./role.commands";
import {
    ROLE_PERMISSION_ASSIGNMENT_COMMANDS,
    ACCOUNT_ROLE_ASSIGNMENT_COMMANDS,
    ROLE_DELEGATION_POLICY_COMMANDS,
    ROLE_CONFLICT_MEMBER_COMMANDS,
    PERMISSION_OVERRIDE_COMMANDS,
    ROLE_CONFLICT_GROUP_COMMANDS,
    PERMISSION_COMMANDS,
    REALM_COMMANDS,
    ROLE_COMMANDS,
} from "./tokens";

export const COMMANDS: Provider[] = [
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
        provide: REALM_COMMANDS,
        useClass: RealmCommands,
    },
    {
        provide: ROLE_COMMANDS,
        useClass: RoleCommands,
    },
];

export {
    ROLE_PERMISSION_ASSIGNMENT_COMMANDS,
    ACCOUNT_ROLE_ASSIGNMENT_COMMANDS,
    ROLE_DELEGATION_POLICY_COMMANDS,
    ROLE_CONFLICT_MEMBER_COMMANDS,
    PERMISSION_OVERRIDE_COMMANDS,
    ROLE_CONFLICT_GROUP_COMMANDS,
    PERMISSION_COMMANDS,
    REALM_COMMANDS,
    ROLE_COMMANDS,
};
