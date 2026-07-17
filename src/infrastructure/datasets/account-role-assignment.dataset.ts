/* eslint-disable @typescript-eslint/explicit-function-return-type, prettier/prettier */
import {
    ADMINISTRATOR_ROLE_ID,
    SYSTEM_USER_ROLE_ID,
    ADMIN_ACCOUNT_ID,
    USER_ACCOUNT_ID,
    SYSTEM_REALM_ID,
} from "~context/constants";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

const entry = (id: string, role: string, account: string) => ({
    id,
    account,
    role_id: role,
    realm_id: SYSTEM_REALM_ID,
    is_system_managed: true,
    is_revoked: false,
    created_at: CREATED_AT,
    version: 1,
});

const dataset = [
    entry("00000010-0000-4000-8000-100000000001", ADMINISTRATOR_ROLE_ID, ADMIN_ACCOUNT_ID),
    entry("00000010-0000-4000-8000-100000000002", SYSTEM_USER_ROLE_ID,   USER_ACCOUNT_ID),
];

export const AccountRoleAssignments = {
    postgresql: dataset,
    redis: dataset,
}
