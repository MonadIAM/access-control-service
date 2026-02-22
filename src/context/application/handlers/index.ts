import { Provider } from "@nestjs/common";

import { RolePermissionAssignmentHandler } from "./role-permission-assignment.handler";
import { AccountRoleAssignmentHandler } from "./account-role-assignment.handler";
import { RoleConflictMemberHandler } from "./role-conflict-member.handler";
import { PermissionOverrideHandler } from "./permission-override.handler";
import { RoleConflictGroupHandler } from "./role-conflict-group.handler";
import { PermissionHandler } from "./permission.handler";
import { RealmHandler } from "./realm.handler";
import { RoleHandler } from "./role.handler";

export const ROLE_PERMISSION_ASSIGNMENT_HANDLER = Symbol("Handlers.RolePermissionAssignment.Contract");
export const ACCOUNT_ROLE_ASSIGNMENT_HANDLER = Symbol("Handlers.AccountRoleAssignment.Contract");
export const ROLE_CONFLICT_MEMBER_HANDLER = Symbol("Handlers.RoleConflictMember.Contract");
export const PERMISSION_OVERRIDE_HANDLER = Symbol("Handlers.PermissionOverride.Contract");
export const ROLE_CONFLICT_GROUP_HANDLER = Symbol("Handlers.RoleConflictGroup.Contract");
export const PERMISSION_HANDLER = Symbol("Handlers.Permission.Contract");
export const REALM_HANDLER = Symbol("Handlers.Realm.Contract");
export const ROLE_HANDLER = Symbol("Handlers.Role.Contract");

export const HANDLERS: Provider[] = [
    {
        provide: ROLE_PERMISSION_ASSIGNMENT_HANDLER,
        useClass: RolePermissionAssignmentHandler,
    },
    {
        provide: ACCOUNT_ROLE_ASSIGNMENT_HANDLER,
        useClass: AccountRoleAssignmentHandler,
    },
    {
        provide: ROLE_CONFLICT_MEMBER_HANDLER,
        useClass: RoleConflictMemberHandler,
    },
    {
        provide: PERMISSION_OVERRIDE_HANDLER,
        useClass: PermissionOverrideHandler,
    },
    {
        provide: ROLE_CONFLICT_GROUP_HANDLER,
        useClass: RoleConflictGroupHandler,
    },
    {
        provide: PERMISSION_HANDLER,
        useClass: PermissionHandler,
    },
    {
        provide: REALM_HANDLER,
        useClass: RealmHandler,
    },
    {
        provide: ROLE_HANDLER,
        useClass: RoleHandler,
    },
];
