---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function remove_role_permission(realm_id, role_id, permission_id)
    redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
    redis.call("SREM", make_key("role-permissions-global", realm_id, role_id), permission_id)
    redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)
end

for _, item in ipairs(payload.items or {}) do
    local permission_id = tostring(item.permission)
    local realm_id = tostring(item.realm)
    local role_id = tostring(item.role)

    local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)
    local stored_permission_realm = redis.call("HGET", assignment_key, "permissionRealm")
    local permission_realm_id = tostring(item.permissionRealm)

    redis.call("UNLINK", assignment_key)

    redis.call("SREM", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
    redis.call("SREM", make_key("role-permission-assignments", "by-permission", realm_id, permission_id), role_id)
    redis.call("SREM", make_key("permission-usages", "role-assignments", permission_realm_id, permission_id), realm_id .. ":" .. role_id)

    remove_role_permission(realm_id, role_id, permission_id)
end

return "OK"
