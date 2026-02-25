/* eslint-disable prettier/prettier */
const SYSTEM_ACTOR = "00000000-0000-4000-8000-000000000000";
const CREATED_AT   = new Date("2026-01-01T00:00:00.000Z");

export const Realms = [
    {
        id: "00000001-0000-4000-8000-200000000001",
        code: "demo",
        name: "Demo",
        description: "Demo realm for testing complex role hierarchies, SoD policies and delegation chains",
        is_system_managed: false,
        is_revoked: false,
        created_at: CREATED_AT,
        version: 1,
        last_actions: { create: { by: { id: SYSTEM_ACTOR } } },
    },
];
