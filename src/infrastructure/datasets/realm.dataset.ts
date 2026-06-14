/* eslint-disable prettier/prettier */
const CREATED_AT   = new Date("2026-01-01T00:00:00.000Z");

export const SystemRealm = {
    id: "00000001-0000-4000-8000-100000000001",
    code: "system",
    name: "System",
    description: "Root system realm for all platform-level entities",
    owner: "00000000-0000-4000-8000-000000000000",
    is_system_managed: true,
    is_revoked: false,
    created_at: CREATED_AT,
    version: 1,
};

const dataset = [SystemRealm];

export const Realms = {
    postgresql: dataset,
    redis: dataset,
}
