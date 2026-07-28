/* eslint-disable prettier/prettier */
import {
    ADMINISTRATOR_ROLE_ID,
    SYSTEM_USER_ROLE_ID,
    SYSTEM_REALM_ID,
    ROOT_ROLE_ID,
} from "~context/constants";

const dataset = [
    { realm_id: SYSTEM_REALM_ID, ancestor_id: ROOT_ROLE_ID, descendant_id: ROOT_ROLE_ID, depth: 0 },

    { realm_id: SYSTEM_REALM_ID, ancestor_id: SYSTEM_USER_ROLE_ID, descendant_id: SYSTEM_USER_ROLE_ID, depth: 0 },
    { realm_id: SYSTEM_REALM_ID, ancestor_id: ROOT_ROLE_ID,        descendant_id: SYSTEM_USER_ROLE_ID, depth: 1 },

    { realm_id: SYSTEM_REALM_ID, ancestor_id: ADMINISTRATOR_ROLE_ID, descendant_id: ADMINISTRATOR_ROLE_ID, depth: 0 },
    { realm_id: SYSTEM_REALM_ID, ancestor_id: ROOT_ROLE_ID,          descendant_id: ADMINISTRATOR_ROLE_ID, depth: 1 },
];

export const RoleClosures = {
    name: "role_closure",
    postgresql: dataset,
    redis: dataset,
};
