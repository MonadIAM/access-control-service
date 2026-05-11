---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function redis_bool(value)
    return value and "1" or "0"
end

local function is_active_entity(key)
    return redis.call("HGET", key, "isRevoked") == "0"
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

local is_revoked = payload.isRevoked == true
local is_revoked_value = redis_bool(is_revoked)
local cleanup_pairs = {}

local function schedule_cleanup(realm_id, account_id)
    cleanup_pairs[realm_id .. ":" .. account_id] = {realm_id, account_id}
end

for _, item in ipairs(payload.items or {}) do
    local assignment_id = tostring(item.assignment)
    local account_id = tostring(item.account)
    local realm_id = tostring(item.realm)
    local role_id = tostring(item.role)

    redis.call("HSET", make_key("account-role-assignment", realm_id, account_id, role_id),
        "assignmentId", assignment_id,
        "isRevoked", is_revoked_value
    )

    redis.call("SADD", make_key("account-role-assignments", "by-account", realm_id, account_id), role_id)
    redis.call("SADD", make_key("account-role-assignments", "by-role", realm_id, role_id), account_id)

    if is_revoked then
        redis.call("SREM", make_key("account-roles", realm_id, account_id), role_id)
        redis.call("SREM", make_key("role-accounts", realm_id, role_id), account_id)
        schedule_cleanup(realm_id, account_id)
    else
        if is_active_entity(make_key("realm", realm_id))
            and is_active_entity(make_key("role", realm_id, role_id)) then
            redis.call("SADD", make_key("account-roles", realm_id, account_id), role_id)
            redis.call("SADD", make_key("role-accounts", realm_id, role_id), account_id)
            redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
            redis.call("SADD", make_key("account-realms", account_id), realm_id)
        end
    end
end

for _, pair in pairs(cleanup_pairs) do
    maybe_remove_account_realm(pair[1], pair[2])
end

return "OK"
