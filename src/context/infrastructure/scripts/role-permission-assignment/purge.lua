---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

for _, item in ipairs(payload.items or {}) do
    local realm_id = tostring(item.realm)
    local role_id = tostring(item.role)
    local permission_id = tostring(item.permission)

    local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)
    local role_permissions_key = make_key("role-permissions", realm_id, role_id)
    local permission_roles_key = make_key("permission-roles", realm_id, permission_id)

    redis.call("UNLINK", assignment_key)

    redis.call("SREM", role_permissions_key, permission_id)
    redis.call("SREM", permission_roles_key, role_id)
end

return "OK"
