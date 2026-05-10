---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function maybe_remove_account_realm(realm_id, account_id)
    local active_roles_count = redis.call("SCARD", make_key("account-roles", realm_id, account_id))
    local active_allow_count = redis.call("SCARD", make_key("account-overrides-allow", realm_id, account_id))
    local active_deny_count = redis.call("SCARD", make_key("account-overrides-deny", realm_id, account_id))

    if active_roles_count == 0 and active_allow_count == 0 and active_deny_count == 0 then
        redis.call("SREM", make_key("realm-accounts", realm_id), account_id)
        redis.call("SREM", make_key("account-realms", account_id), realm_id)
    end
end

local cleanup_pairs = {}

local function schedule_cleanup(realm_id, account_id)
    cleanup_pairs[realm_id .. ":" .. account_id] = {realm_id, account_id}
end

local realm_id = tostring(payload.realm)

for _, permission in ipairs(payload.permissions or {}) do
    local permission_id = tostring(permission)

    local role_ids = redis.call("SMEMBERS", make_key("role-permission-assignments", "by-permission", realm_id, permission_id))
    for _, role_id in ipairs(role_ids) do
        redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
        redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)

        redis.call("UNLINK", make_key("role-permission-assignment", realm_id, role_id, permission_id))
        redis.call("SREM", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
    end

    local account_ids = redis.call("SMEMBERS", make_key("permission-overrides", "by-permission", realm_id, permission_id))
    for _, account_id in ipairs(account_ids) do
        redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
        redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
        redis.call("SREM", make_key("permission-override-accounts", realm_id, permission_id), account_id)

        redis.call("UNLINK", make_key("permission-override", realm_id, account_id, permission_id))
        redis.call("SREM", make_key("permission-overrides", "by-account", realm_id, account_id), permission_id)

        schedule_cleanup(realm_id, account_id)
    end

    redis.call("UNLINK", make_key("permission", realm_id, permission_id))
    redis.call("HDEL", make_key("permission-code-by-id", realm_id), permission_id)

    redis.call("UNLINK", make_key("permission-roles", realm_id, permission_id))
    redis.call("UNLINK", make_key("permission-override-accounts", realm_id, permission_id))
    redis.call("UNLINK", make_key("role-permission-assignments", "by-permission", realm_id, permission_id))
    redis.call("UNLINK", make_key("permission-overrides", "by-permission", realm_id, permission_id))
end

for _, pair in pairs(cleanup_pairs) do
    maybe_remove_account_realm(pair[1], pair[2])
end

return "OK"
