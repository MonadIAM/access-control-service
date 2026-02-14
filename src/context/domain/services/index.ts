import { RoleService } from "./role.service";

export const ROLE_SERVICE = Symbol("Services.Role.Contract");

export const SERVICES = [
    {
        provide: ROLE_SERVICE,
        useClass: RoleService,
    },
];
