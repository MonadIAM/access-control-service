import { SYSTEM_ACCOUNT_ID, SYSTEM_REALM_ID } from "~context/constants";
import { RealmType } from "~context/enums";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

export const SystemRealm = {
    id: SYSTEM_REALM_ID,
    code: "system",
    type: RealmType.SYSTEM,
    is_system_revoked: false,
    name: "System",
    description: "Root system realm for all platform-level entities",
    owner: SYSTEM_ACCOUNT_ID,
    is_system_managed: true,
    is_revoked: false,
    created_at: CREATED_AT,
    version: 1,
};

const dataset = [SystemRealm];

export const Realms = {
    postgresql: dataset,
    redis: dataset,
    name: "realm",
};
