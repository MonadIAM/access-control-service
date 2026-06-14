/* eslint-disable prettier/prettier */
const SYSTEM_REALM = "00000001-0000-4000-8000-100000000001";

const ROOT          = "00000002-0000-4000-8000-100000000001";
const USER          = "00000002-0000-4000-8000-100000000002";
const ADMINISTRATOR = "00000002-0000-4000-8000-100000000003";

const dataset = [
    { realm_id: SYSTEM_REALM, ancestor_id: ROOT, descendant_id: ROOT, depth: 0 },

    { realm_id: SYSTEM_REALM, ancestor_id: USER, descendant_id: USER, depth: 0 },
    { realm_id: SYSTEM_REALM, ancestor_id: ROOT, descendant_id: USER, depth: 1 },

    { realm_id: SYSTEM_REALM, ancestor_id: ADMINISTRATOR, descendant_id: ADMINISTRATOR, depth: 0 },
    { realm_id: SYSTEM_REALM, ancestor_id: ROOT,          descendant_id: ADMINISTRATOR, depth: 1 },
];

export const RoleClosures = {
    postgresql: dataset,
    redis: dataset,
}
