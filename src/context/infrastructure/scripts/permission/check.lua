---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local account_id = tostring(payload.account)
local realm_id = tostring(payload.realm)
local permission_realm_id = tostring(payload.permissionRealm)
local system_realm_id = tostring(payload.systemRealm)
local global_only = payload.globalOnly == true

local permission_codes = payload.permissions
if type(permission_codes) ~= "table" then
    permission_codes = {}

    if payload.permission ~= nil then
        permission_codes[1] = payload.permission
    end
end

local target_role_ids = {}
if not global_only then
    target_role_ids = redis.call("SMEMBERS", make_key("account-roles", realm_id, account_id))
end
local system_role_ids = nil

local function has_role_permission(permission_id)
    for _, role_id in ipairs(target_role_ids) do
        if redis.call("SISMEMBER", make_key("role-permissions", realm_id, role_id), permission_id) == 1 then
            return true
        end
    end

    return false
end

local function has_global_role_permission(permission_id)
    if system_role_ids == nil then
        if not global_only and realm_id == system_realm_id then
            system_role_ids = target_role_ids
        else
            system_role_ids = redis.call("SMEMBERS", make_key("account-roles", system_realm_id, account_id))
        end
    end
    for _, role_id in ipairs(system_role_ids) do
        if redis.call("SISMEMBER", make_key("role-permissions-global", system_realm_id, role_id), permission_id) == 1 then
            return true
        end
    end

    return false
end

local matched = {}

for _, permission in ipairs(permission_codes) do
    local permission_code = tostring(permission)
    local permission_id = redis.call("HGET", make_key("permission-id-by-code", permission_realm_id), permission_code)

    if permission_id then
        local scope = nil

        if not global_only and redis.call("SISMEMBER", make_key("account-overrides-deny", realm_id, account_id), permission_id) ~= 1 then
            if redis.call("SISMEMBER", make_key("account-overrides-allow", realm_id, account_id), permission_id) == 1 then
                scope = "REALM"
            elseif has_role_permission(permission_id) then
                scope = "REALM"
            end
        end

        if scope == nil and has_global_role_permission(permission_id) then
            scope = "GLOBAL"
        end

        if scope then
            matched[permission_code] = scope
        end
    end
end

return cjson.encode(matched)
