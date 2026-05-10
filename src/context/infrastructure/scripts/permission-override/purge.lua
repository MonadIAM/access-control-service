---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

for _, item in ipairs(payload.items or {}) do
    local permission_id = tostring(item.permission)
    local account_id = tostring(item.account)
    local realm_id = tostring(item.realm)

    redis.call("UNLINK", make_key("permission-override", realm_id, account_id, permission_id))

    redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
    redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
    redis.call("SREM", make_key("permission-override-accounts", realm_id, permission_id), account_id)

    local active_roles_count = redis.call("SCARD", make_key("account-roles", realm_id, account_id))
    local active_allow_count = redis.call("SCARD", make_key("account-overrides-allow", realm_id, account_id))
    local active_deny_count = redis.call("SCARD", make_key("account-overrides-deny", realm_id, account_id))

    if active_roles_count == 0 and active_allow_count == 0 and active_deny_count == 0 then
        redis.call("SREM", make_key("realm-accounts", realm_id), account_id)
        redis.call("SREM", make_key("account-realms", account_id), realm_id)
    end
end

return "OK"
