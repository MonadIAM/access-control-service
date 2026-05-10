---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function to_redis_bool(value)
    return value and "1" or "0"
end

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local account_id = tostring(payload.account)
local realm_id = tostring(payload.realm)

local realm_is_revoked = redis.call("HGET", make_key("realm", realm_id), "isRevoked")

for _, assignment in ipairs(payload.assignments or {}) do
    local assignment_id = tostring(assignment.assignment)
    local version = tonumber(assignment.version) or 1
    local role_id = tostring(assignment.role)

    redis.call("HSET", make_key("account-role-assignment", realm_id, account_id, role_id),
        "assignmentId", assignment_id,
        "isRevoked", to_redis_bool(false),
        "version", version
    )

    local role_is_revoked = redis.call("HGET", make_key("role", realm_id, role_id), "isRevoked")

    if realm_is_revoked == "0" and role_is_revoked == "0" then
        redis.call("SADD", make_key("account-roles", realm_id, account_id), role_id)
        redis.call("SADD", make_key("role-accounts", realm_id, role_id), account_id)
        redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
        redis.call("SADD", make_key("account-realms", account_id), realm_id)
    end
end

return "OK"
