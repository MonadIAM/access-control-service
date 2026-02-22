import { RolePermissionAssignmentHandler } from "./role-permission-assignment.handler";
import { AccountRoleAssignmentHandler } from "./account-role-assignment.handler";
import { RoleConflictMemberHandler } from "./role-conflict-member.handler";
import { RoleConflictGroupHandler } from "./role-conflict-group.handler";
import { PermissionHandler } from "./permission.handler";
import { RealmHandler } from "./realm.handler";
import { RoleHandler } from "./role.handler";

export const ROLE_PERMISSION_ASSIGNMENT_HANDLER = Symbol("Repositories.RolePermissionAssignment.Contract");
export const ACCOUNT_ROLE_ASSIGNMENT_HANDLER = Symbol("Repositories.AccountRoleAssignment.Contract");
export const ROLE_CONFLICT_MEMBER_HANDLER = Symbol("Repositories.RoleConflictMember.Contract");
export const ROLE_CONFLICT_GROUP_HANDLER = Symbol("Repositories.RoleConflictGroup.Contract");
export const PERMISSION_HANDLER = Symbol("Repositories.Permission.Contract");
export const REALM_HANDLER = Symbol("Repositories.Realm.Contract");
export const ROLE_HANDLER = Symbol("Repositories.Role.Contract");

export const HANDLERS = [
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
