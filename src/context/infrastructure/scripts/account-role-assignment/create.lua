---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function is_active_entity(key)
    return redis.call("HGET", key, "isRevoked") == "0"
end

local account_id = tostring(payload.account)
local realm_id = tostring(payload.realm)

local realm_active = is_active_entity(make_key("realm", realm_id))

for _, assignment in ipairs(payload.assignments or {}) do
    local assignment_id = tostring(assignment.assignment)
    local version = tonumber(assignment.version) or 1
    local role_id = tostring(assignment.role)

    redis.call("HSET", make_key("account-role-assignment", realm_id, account_id, role_id),
        "assignmentId", assignment_id,
        "isRevoked", "0",
        "version", version
    )

    redis.call("SADD", make_key("account-role-assignments", "by-account", realm_id, account_id), role_id)
    redis.call("SADD", make_key("account-role-assignments", "by-role", realm_id, role_id), account_id)

    if realm_active and is_active_entity(make_key("role", realm_id, role_id)) then
        redis.call("SADD", make_key("account-roles", realm_id, account_id), role_id)
        redis.call("SADD", make_key("role-accounts", realm_id, role_id), account_id)
        redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
        redis.call("SADD", make_key("account-realms", account_id), realm_id)
    end
end

return "OK"
