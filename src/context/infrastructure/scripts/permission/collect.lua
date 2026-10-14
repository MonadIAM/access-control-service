---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local permission_realm_id = tostring(payload.permissionRealm)
local system_realm_id = tostring(payload.systemRealm)
local account_id = tostring(payload.account)
local code_cache = {}

local function permission_code(permission_id, perm_realm)
    local codes = code_cache[perm_realm]
    if codes == nil then
        codes = {}
        code_cache[perm_realm] = codes
    end
    if codes[permission_id] == nil then
        codes[permission_id] = redis.call("HGET", make_key("permission-code-by-id", perm_realm), permission_id)
    end
    return codes[permission_id]
end

local system_role_ids = redis.call("SMEMBERS", make_key("account-roles", system_realm_id, account_id))
local global_permissions = {}
local result = { realms = {}, global = {} }

for _, role_id in ipairs(system_role_ids) do
    local permission_ids = redis.call("SMEMBERS", make_key("role-permissions-global", system_realm_id, role_id))
    for _, permission_id in ipairs(permission_ids) do
        if global_permissions[permission_id] == nil then
            local code = permission_code(permission_id, permission_realm_id)
            global_permissions[permission_id] = code
            if code then
                result.global[code] = "GLOBAL"
            end
        end
    end
end

for _, realm in ipairs(payload.realms) do
    local realm_id = tostring(realm)
    local effective_permissions = {}
    local role_ids = system_role_ids
    if realm_id ~= system_realm_id then
        role_ids = redis.call("SMEMBERS", make_key("account-roles", realm_id, account_id))
    end

    for _, role_id in ipairs(role_ids) do
        local permission_ids = redis.call("SMEMBERS", make_key("role-permissions", realm_id, role_id))
        for _, permission_id in ipairs(permission_ids) do
            effective_permissions[permission_id] = permission_realm_id
        end
    end

    local allow_permission_ids = redis.call("SMEMBERS", make_key("account-overrides-allow", realm_id, account_id))
    for _, permission_id in ipairs(allow_permission_ids) do
        local override_key = make_key("permission-override", realm_id, account_id, permission_id)
        effective_permissions[permission_id] = redis.call("HGET", override_key, "permissionRealm") or permission_realm_id
    end

    local deny_permission_ids = redis.call("SMEMBERS", make_key("account-overrides-deny", realm_id, account_id))
    for _, permission_id in ipairs(deny_permission_ids) do
        effective_permissions[permission_id] = nil
    end

    local permissions = {}
    for permission_id, perm_realm in pairs(effective_permissions) do
        local code = permission_code(permission_id, perm_realm)
        if code then
            permissions[code] = "REALM"
        end
    end
    result.realms[realm_id] = permissions
end

return cjson.encode(result)
