/* eslint-disable @typescript-eslint/explicit-function-return-type, prettier/prettier */
import { ROOT_ROLE_ID, SYSTEM_USER_ROLE_ID, ADMINISTRATOR_ROLE_ID, SYSTEM_REALM_ID } from "~context/constants";
import { RoleActorType, RolePrototype } from "~context/enums";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

const entry = (
    id: string,
    code: string,
    name: string,
    description: string,
    actorType = RoleActorType.HUMAN,
    nonDelegable = false,
) => ({
    id,
    code,
    name,
    description,
    is_system_managed: true,
    non_delegable: nonDelegable,
    is_revoked: false,
    prototype: RolePrototype.COMPOSITE,
    actor_type: actorType,
    realm_id: SYSTEM_REALM_ID,
    created_at: CREATED_AT,
    version: 1,
});

const dataset = [
    entry(
        ROOT_ROLE_ID,
        "system.root",
        "System",
        "Role not available to users",
        RoleActorType.SYSTEM,
        true,
    ),
    entry(
        SYSTEM_USER_ROLE_ID,
        "system.user",
        "User",
        "Basic role for all users",
    ),
    entry(
        ADMINISTRATOR_ROLE_ID,
        "system.administrator",
        "Administrator",
        "The role that grants maximum privileges within the entire system",
        RoleActorType.HUMAN,
        true,
    ),
];

export const Roles = {
    postgresql: dataset,
    redis: dataset,
}
