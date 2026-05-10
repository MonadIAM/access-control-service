export enum ProjectionScript {
    ROLE_PERMISSION_ASSIGNMENT_CREATE = "role-permission-assignment/create",
    ROLE_PERMISSION_ASSIGNMENT_UPDATE = "role-permission-assignment/update",
    ROLE_PERMISSION_ASSIGNMENT_PURGE = "role-permission-assignment/purge",

    ACCOUNT_ROLE_ASSIGNMENT_CREATE = "account-role-assignment/create",
    ACCOUNT_ROLE_ASSIGNMENT_UPDATE = "account-role-assignment/update",
    ACCOUNT_ROLE_ASSIGNMENT_PURGE = "account-role-assignment/purge",

    PERMISSION_OVERRIDE_CREATE = "permission-override/create",
    PERMISSION_OVERRIDE_UPDATE = "permission-override/update",
    PERMISSION_OVERRIDE_PURGE = "permission-override/purge",

    ROLE_CLOSURE_UPDATE = "role-closure/update",

    PERMISSION_CREATE = "permission/create",
    PERMISSION_UPDATE = "permission/update",
    PERMISSION_PURGE = "permission/purge",

    REALM_CREATE = "realm/create",
    REALM_UPDATE = "realm/update",
    REALM_PURGE = "realm/purge",

    ROLE_CREATE = "role/create",
    ROLE_UPDATE = "role/update",
    ROLE_PURGE = "role/purge",
}

export const PROJECTION_SCRIPT_FILES: Record<ProjectionScript, string> = {
    [ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_CREATE]: "role-permission-assignment/create.lua",
    [ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_UPDATE]: "role-permission-assignment/update.lua",
    [ProjectionScript.ROLE_PERMISSION_ASSIGNMENT_PURGE]: "role-permission-assignment/purge.lua",

    [ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_CREATE]: "account-role-assignment/create.lua",
    [ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_UPDATE]: "account-role-assignment/update.lua",
    [ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_PURGE]: "account-role-assignment/purge.lua",

    [ProjectionScript.PERMISSION_OVERRIDE_CREATE]: "permission-override/create.lua",
    [ProjectionScript.PERMISSION_OVERRIDE_UPDATE]: "permission-override/update.lua",
    [ProjectionScript.PERMISSION_OVERRIDE_PURGE]: "permission-override/purge.lua",

    [ProjectionScript.ROLE_CLOSURE_UPDATE]: "role-closure/update.lua",

    [ProjectionScript.PERMISSION_CREATE]: "permission/create.lua",
    [ProjectionScript.PERMISSION_UPDATE]: "permission/update.lua",
    [ProjectionScript.PERMISSION_PURGE]: "permission/purge.lua",

    [ProjectionScript.REALM_CREATE]: "realm/create.lua",
    [ProjectionScript.REALM_UPDATE]: "realm/update.lua",
    [ProjectionScript.REALM_PURGE]: "realm/purge.lua",

    [ProjectionScript.ROLE_CREATE]: "role/create.lua",
    [ProjectionScript.ROLE_UPDATE]: "role/update.lua",
    [ProjectionScript.ROLE_PURGE]: "role/purge.lua",
};
