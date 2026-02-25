/* eslint-disable @typescript-eslint/explicit-function-return-type, prettier/prettier */
import { RoleActorType, RoleProtoType } from "~context/enums";

const SYSTEM_ACTOR = "00000000-0000-4000-8000-000000000000";
const SYSTEM_REALM = "00000001-0000-4000-8000-100000000001";
const CREATED_AT   = new Date("2026-01-01T00:00:00.000Z");

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
    proto_type: RoleProtoType.COMPOSITE,
    actor_type: actorType,
    realm_id: SYSTEM_REALM,
    created_at: CREATED_AT,
    version: 1,
    last_actions: { create: { by: { id: SYSTEM_ACTOR } } },
});

export const Roles = [
    entry(
        "00000002-0000-4000-8000-100000000001",
        "system.root",
        "System",
        "Role not available to users",
        RoleActorType.SYSTEM,
        true,
    ),
    entry(
        "00000002-0000-4000-8000-100000000002",
        "system.user",
        "User",
        "Basic role for all users",
    ),
    entry(
        "00000002-0000-4000-8000-100000000003",
        "system.administrator",
        "Administrator",
        "The role that grants maximum privileges within the entire system",
        RoleActorType.HUMAN,
        true,
    ),
    entry(
        "00000002-0000-4000-8000-100000000004",
        "system.subscriber",
        "Subscriber",
        "Paid access role, allows creating and managing realms for service integration",
    ),
];
