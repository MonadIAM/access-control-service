/* eslint-disable @typescript-eslint/explicit-function-return-type, prettier/prettier */
const SYSTEM_REALM = "00000001-0000-4000-8000-100000000001";
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

const SYSTEM_USER   = "00000002-0000-4000-8000-100000000002";
const ADMINISTRATOR = "00000002-0000-4000-8000-100000000003";
const SUBSCRIBER    = "00000002-0000-4000-8000-100000000004";

const ADMINISTRATOR_ACCOUNT = "00000000-0000-4000-8000-000000000001";
const USER_ACCOUNT          = "00000000-0000-4000-8000-000000000002";
const SUBSCRIBER_ACCOUNT    = "00000000-0000-4000-8000-000000000003";

export const AccountRoleAssignments = [
    entry("00000010-0000-4000-8000-100000000001", ADMINISTRATOR, ADMINISTRATOR_ACCOUNT),
    entry("00000010-0000-4000-8000-100000000002", SYSTEM_USER,   USER_ACCOUNT),
    entry("00000010-0000-4000-8000-100000000003", SUBSCRIBER,    SUBSCRIBER_ACCOUNT),
];
