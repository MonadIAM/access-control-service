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

local function remove_role_permission(realm_id, role_id, permission_id)
    redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
    redis.call("SREM", make_key("role-permissions-global", realm_id, role_id), permission_id)
    redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)
end

local function activate_role_permission(realm_id, role_id, permission_id, scope)
    if scope == "GLOBAL" then
        redis.call("SADD", make_key("role-permissions-global", realm_id, role_id), permission_id)
    elseif scope == "REALM" then
        redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
    else
        remove_role_permission(realm_id, role_id, permission_id)
        return
    end

    redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
end

local is_revoked = to_bool(payload.isRevoked)
local is_revoked_value = redis_bool(is_revoked)

for _, item in ipairs(payload.items or {}) do
    local assignment_id = tostring(item.assignment)
    local permission_id = tostring(item.permission)
    local realm_id = tostring(item.realm)
    local role_id = tostring(item.role)

    local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)
    local stored_permission_realm = redis.call("HGET", assignment_key, "permissionRealm")
    local permission_realm_id = tostring(item.permissionRealm or item.permission_realm or stored_permission_realm or realm_id)
    local scope = tostring(item.scope or redis.call("HGET", assignment_key, "scope") or "")

    redis.call("HSET", assignment_key,
        "assignmentId", assignment_id,
        "isRevoked", is_revoked_value,
        "scope", scope,
        "permissionRealm", permission_realm_id
    )

    redis.call("SADD", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
    redis.call("SADD", make_key("role-permission-assignments", "by-permission", realm_id, permission_id), role_id)
    redis.call("SADD", make_key("permission-usages", "role-assignments", permission_realm_id, permission_id), realm_id .. ":" .. role_id)

    if is_revoked then
        remove_role_permission(realm_id, role_id, permission_id)
    else
        if is_active_entity(make_key("realm", realm_id))
            and is_active_entity(make_key("role", realm_id, role_id))
            and is_active_entity(make_key("permission", permission_realm_id, permission_id)) then
            activate_role_permission(realm_id, role_id, permission_id, scope)
        else
            remove_role_permission(realm_id, role_id, permission_id)
        end
    end
end

return "OK"
