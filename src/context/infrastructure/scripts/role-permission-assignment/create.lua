---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
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

local realm_id = tostring(payload.realm)
local role_id = tostring(payload.role)

local realm_active = is_active_entity(make_key("realm", realm_id))
local role_active = is_active_entity(make_key("role", realm_id, role_id))

for _, item in ipairs(payload.assignments or {}) do
    local permission_realm_id = tostring(item.permissionRealm)
    local permission_id = tostring(item.permission)
    local assignment_id = tostring(item.assignment)
    local scope = tostring(item.scope)

    local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)

    redis.call("HSET", assignment_key,
        "assignmentId", assignment_id,
        "isRevoked", "0",
        "scope", scope,
        "permissionRealm", permission_realm_id
    )

    redis.call("SADD", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
    redis.call("SADD", make_key("role-permission-assignments", "by-permission", realm_id, permission_id), role_id)
    redis.call("SADD", make_key("permission-usages", "role-assignments", permission_realm_id, permission_id), realm_id .. ":" .. role_id)

    if realm_active
        and role_active
        and is_active_entity(make_key("permission", permission_realm_id, permission_id)) then
        activate_role_permission(realm_id, role_id, permission_id, scope)
    else
        remove_role_permission(realm_id, role_id, permission_id)
    end
end

return "OK"
