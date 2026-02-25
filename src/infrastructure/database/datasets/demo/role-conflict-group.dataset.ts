/* eslint-disable @typescript-eslint/explicit-function-return-type, prettier/prettier */
const SYSTEM_ACTOR = "00000000-0000-4000-8000-000000000000";
const DEMO_REALM   = "00000001-0000-4000-8000-200000000001";
const CREATED_AT   = new Date("2026-01-01T00:00:00.000Z");

const entry = (id: string, code: string, name: string, description: string) => ({
    id,
    code,
    name,
    description,
    realm_id: DEMO_REALM,
    max_allowed: 1,
    is_system_managed: false,
    is_revoked: false,
    created_at: CREATED_AT,
    version: 1,
    last_actions: { create: { by: { id: SYSTEM_ACTOR } } },
});

export const RoleConflictGroups = [
    entry(
        "00000008-0000-4000-8000-200000000001",
        "conflict.be",
        "BE Conflict",
        "Prevents holding more than one backend development role simultaneously.",
    ),
    entry(
        "00000008-0000-4000-8000-200000000002",
        "conflict.fe",
        "FE Conflict",
        "Prevents holding more than one frontend development role simultaneously.",
    ),
    entry(
        "00000008-0000-4000-8000-200000000003",
        "conflict.qa",
        "QA Conflict",
        "Prevents holding more than one QA role simultaneously.",
    ),
    entry(
        "00000008-0000-4000-8000-200000000004",
        "conflict.ba",
        "BA Conflict",
        "Prevents holding more than one business analyst role simultaneously.",
    ),
];
