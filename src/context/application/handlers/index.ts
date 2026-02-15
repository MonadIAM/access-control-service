import { PermissionHandler } from "./permission.handler";
import { RealmHandler } from "./realm.handler";
import { RoleHandler } from "./role.handler";

export const PERMISSION_HANDLER = Symbol("Repositories.Permission.Contract");
export const REALM_HANDLER = Symbol("Repositories.Realm.Contract");
export const ROLE_HANDLER = Symbol("Repositories.Role.Contract");

export const HANDLERS = [
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
