import { RoleHandler } from "./role.handler";

export const ROLE_HANDLER = Symbol("Repositories.Role.Contract");

export const HANDLERS = [
    {
        provide: ROLE_HANDLER,
        useClass: RoleHandler,
    },
];
