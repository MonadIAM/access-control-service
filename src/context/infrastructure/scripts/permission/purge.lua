---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function parse_pair(value)
    local first, second = string.match(value, "^([^:]+):([^:]+)$")
    return first, second
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

local permission_realm_id = tostring(payload.realm)

for _, permission in ipairs(payload.permissions or {}) do
    local permission_id = tostring(permission)

    local role_usage_ids = redis.call("SMEMBERS", make_key("permission-usages", "role-assignments", permission_realm_id, permission_id))
    for _, usage_id in ipairs(role_usage_ids) do
        local target_realm_id, role_id = parse_pair(usage_id)

        if target_realm_id and role_id then
            redis.call("SREM", make_key("role-permissions", target_realm_id, role_id), permission_id)
            redis.call("SREM", make_key("permission-roles", target_realm_id, permission_id), role_id)

            redis.call("UNLINK", make_key("role-permission-assignment", target_realm_id, role_id, permission_id))
            redis.call("SREM", make_key("role-permission-assignments", "by-role", target_realm_id, role_id), permission_id)
            redis.call("SREM", make_key("role-permission-assignments", "by-permission", target_realm_id, permission_id), role_id)
        end
    end

    local override_usage_ids = redis.call("SMEMBERS", make_key("permission-usages", "overrides", permission_realm_id, permission_id))
    for _, usage_id in ipairs(override_usage_ids) do
        local target_realm_id, account_id = parse_pair(usage_id)

        if target_realm_id and account_id then
            redis.call("SREM", make_key("account-overrides-allow", target_realm_id, account_id), permission_id)
            redis.call("SREM", make_key("account-overrides-deny", target_realm_id, account_id), permission_id)
            redis.call("SREM", make_key("permission-override-accounts", target_realm_id, permission_id), account_id)

            redis.call("UNLINK", make_key("permission-override", target_realm_id, account_id, permission_id))
            redis.call("SREM", make_key("permission-overrides", "by-account", target_realm_id, account_id), permission_id)
            redis.call("SREM", make_key("permission-overrides", "by-permission", target_realm_id, permission_id), account_id)

            schedule_cleanup(target_realm_id, account_id)
        end
    end

    redis.call("UNLINK", make_key("permission", permission_realm_id, permission_id))
    redis.call("HDEL", make_key("permission-code-by-id", permission_realm_id), permission_id)

    redis.call("UNLINK", make_key("permission-roles", permission_realm_id, permission_id))
    redis.call("UNLINK", make_key("permission-override-accounts", permission_realm_id, permission_id))
    redis.call("UNLINK", make_key("role-permission-assignments", "by-permission", permission_realm_id, permission_id))
    redis.call("UNLINK", make_key("permission-overrides", "by-permission", permission_realm_id, permission_id))
    redis.call("UNLINK", make_key("permission-usages", "role-assignments", permission_realm_id, permission_id))
    redis.call("UNLINK", make_key("permission-usages", "overrides", permission_realm_id, permission_id))
end

for _, pair in pairs(cleanup_pairs) do
    maybe_remove_account_realm(pair[1], pair[2])
end

return "OK"
