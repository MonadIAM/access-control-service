import { RealmService } from "./realm.service";
import { RoleService } from "./role.service";

export const REALM_SERVICE = Symbol("Services.Realm.Contract");
export const ROLE_SERVICE = Symbol("Services.Role.Contract");

export const SERVICES = [
    {
        provide: REALM_SERVICE,
        useClass: RealmService,
    },
    {
        provide: ROLE_SERVICE,
        useClass: RoleService,
    },
];
