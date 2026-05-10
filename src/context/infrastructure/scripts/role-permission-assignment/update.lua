---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function to_bool(value)
    return value == true or value == 1 or value == "1" or value == "true"
end

local function redis_bool(value)
    return value and "1" or "0"
end

local function is_active_entity(key)
    return redis.call("HGET", key, "isRevoked") == "0"
end

local is_revoked_value = redis_bool(is_revoked)
local is_revoked = to_bool(payload.isRevoked)

for _, item in ipairs(payload.items or {}) do
    local assignment_id = tostring(item.assignment)
    local permission_id = tostring(item.permission)
    local version = tonumber(item.version) or 1
    local realm_id = tostring(item.realm)
    local role_id = tostring(item.role)

    local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)
    local role_permissions_key = make_key("role-permissions", realm_id, role_id)
    local permission_roles_key = make_key("permission-roles", realm_id, permission_id)

    redis.call("HSET", assignment_key,
        "assignmentId", assignment_id,
        "isRevoked", is_revoked_value,
        "version", version
    )

    redis.call("SADD", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
    redis.call("SADD", make_key("role-permission-assignments", "by-permission", realm_id, permission_id), role_id)

    if is_revoked then
        redis.call("SREM", role_permissions_key, permission_id)
        redis.call("SREM", permission_roles_key, role_id)
    else
        if is_active_entity(make_key("realm", realm_id))
            and is_active_entity(make_key("role", realm_id, role_id))
            and is_active_entity(make_key("permission", realm_id, permission_id)) then
            redis.call("SADD", role_permissions_key, permission_id)
            redis.call("SADD", permission_roles_key, role_id)
        end
    end
end

return "OK"
