---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local permission_realm_id = tostring(payload.permissionRealm)
local system_realm_id = tostring(payload.systemRealm)
local account_id = tostring(payload.account)
local realm_id = tostring(payload.realm)

local effective_permissions = {}

local function add_permission(permission_id, scope, perm_realm)
    effective_permissions[permission_id] = { scope = scope, permissionRealm = perm_realm }
end

local function remove_permission(permission_id)
    effective_permissions[permission_id] = nil
end

local function add_role_permissions(source_realm_id, role_permissions_key_builder, scope)
    local role_ids = redis.call("SMEMBERS", make_key("account-roles", source_realm_id, account_id))

    for _, role_id in ipairs(role_ids) do
        local permission_ids = redis.call("SMEMBERS", role_permissions_key_builder(source_realm_id, role_id))

        for _, permission_id in ipairs(permission_ids) do
            add_permission(permission_id, scope, permission_realm_id)
        end
    end
end

add_role_permissions(realm_id, function(source_realm_id, role_id)
    return make_key("role-permissions", source_realm_id, role_id)
end, "REALM")

add_role_permissions(system_realm_id, function(source_realm_id, role_id)
    return make_key("role-permissions-global", source_realm_id, role_id)
end, "GLOBAL")

local allow_permission_ids = redis.call("SMEMBERS", make_key("account-overrides-allow", realm_id, account_id))

for _, permission_id in ipairs(allow_permission_ids) do
    local override_key = make_key("permission-override", realm_id, account_id, permission_id)
    local override_permission_realm_id = redis.call("HGET", override_key, "permissionRealm") or permission_realm_id

    add_permission(permission_id, "REALM", override_permission_realm_id)
end

local deny_permission_ids = redis.call("SMEMBERS", make_key("account-overrides-deny", realm_id, account_id))

for _, permission_id in ipairs(deny_permission_ids) do
    remove_permission(permission_id)
end

local result = {}

for permission_id, entry in pairs(effective_permissions) do
    local code = redis.call("HGET", make_key("permission-code-by-id", entry.permissionRealm), permission_id)

    if code then
        result[code] = entry.scope
    end
end

return cjson.encode(result)
