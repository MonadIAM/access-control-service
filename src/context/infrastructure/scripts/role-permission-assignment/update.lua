---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function to_redis_bool(value)
    return value and "1" or "0"
end

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

for _, item in ipairs(payload.items or {}) do
    local is_revoked = to_redis_bool(payload.isRevoked)
    local assignment_id = tostring(item.assignment)
    local permission_id = tostring(item.permission)
    local version = tonumber(item.version) or 1
    local realm_id = tostring(item.realm)
    local role_id = tostring(item.role)

    local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)
    local permission_roles_key = make_key("permission-roles", realm_id, permission_id)
    local role_permissions_key = make_key("role-permissions", realm_id, role_id)

    redis.call("HSET", assignment_key,
        "assignmentId", assignment_id,
        "isRevoked", to_redis_bool(is_revoked),
        "version", version
    )

    if is_revoked then
        redis.call("SREM", role_permissions_key, permission_id)
        redis.call("SREM", permission_roles_key, role_id)
    else
        local realm_is_revoked = redis.call("HGET", make_key("realm", realm_id), "isRevoked")
        local role_is_revoked = redis.call("HGET", make_key("role", realm_id, role_id), "isRevoked")
        local perm_is_revoked = redis.call("HGET", make_key("permission", realm_id, permission_id), "isRevoked")

        if realm_is_revoked == "0" and role_is_revoked == "0" and perm_is_revoked == "0" then
            redis.call("SADD", role_permissions_key, permission_id)
            redis.call("SADD", permission_roles_key, role_id)
        end
    end
end

return "OK"
