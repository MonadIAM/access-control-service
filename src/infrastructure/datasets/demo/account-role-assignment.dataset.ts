/* eslint-disable @typescript-eslint/explicit-function-return-type, prettier/prettier */
const SYSTEM_REALM = "00000001-0000-4000-8000-200000000001";
const CREATED_AT   = new Date("2026-01-01T00:00:00.000Z");

const entry = (id: string, role: string, account: string) => ({
    id,
    account,
    role_id: role,
    realm_id: SYSTEM_REALM,
    is_system_managed: true,
    is_revoked: false,
    created_at: CREATED_AT,
    version: 1,
});

const SYSTEM_USER = "00000002-0000-4000-8000-100000000002";

const DEMO_ADMIN = "00000002-0000-4000-8000-200000000003";

export const AccountRoleAssignments = [
    entry("00000010-0000-4000-8000-200000000001", SYSTEM_USER, DEMO_ADMIN),
];
