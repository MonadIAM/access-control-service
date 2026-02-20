import { RolePermissionAssignmentHandler } from "./role-permission-assignment.handler";
import { AccountRoleAssignmentHandler } from "./account-role-assignment.handler";
import { PermissionHandler } from "./permission.handler";
import { RealmHandler } from "./realm.handler";
import { RoleHandler } from "./role.handler";

export const ROLE_PERMISSION_ASSIGNMENT_HANDLER = Symbol("Repositories.RolePermissionAssignment.Contract");
export const ACCOUNT_ROLE_ASSIGNMENT_HANDLER = Symbol("Repositories.AccountRoleAssignment.Contract");
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
