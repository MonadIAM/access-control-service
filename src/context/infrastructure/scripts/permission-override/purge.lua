---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

for _, item in ipairs(payload.items or {}) do
    local permission_id = tostring(item.permission)
    local account_id = tostring(item.account)
    local realm_id = tostring(item.realm)

    local override_key = make_key("permission-override", realm_id, account_id, permission_id)
    local permission_realm_id = tostring(item.permissionRealm)

    redis.call("UNLINK", override_key)

    redis.call("SREM", make_key("permission-overrides", "by-account", realm_id, account_id), permission_id)
    redis.call("SREM", make_key("permission-overrides", "by-permission", realm_id, permission_id), account_id)
    redis.call("SREM", make_key("permission-overrides", "by-realm", realm_id), account_id .. ":" .. permission_id)
    redis.call("SREM", make_key("permission-usages", "overrides", permission_realm_id, permission_id), realm_id .. ":" .. account_id)

    redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
    redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
    redis.call("SREM", make_key("permission-override-accounts", realm_id, permission_id), account_id)
end

return "OK"
