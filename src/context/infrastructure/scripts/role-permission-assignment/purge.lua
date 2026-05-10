---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

for _, item in ipairs(payload.items or {}) do
    local realm_id = tostring(item.realm)
    local role_id = tostring(item.role)
    local permission_id = tostring(item.permission)

    redis.call("UNLINK", make_key("role-permission-assignment", realm_id, role_id, permission_id))

    redis.call("SREM", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
    redis.call("SREM", make_key("role-permission-assignments", "by-permission", realm_id, permission_id), role_id)

    redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
    redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)
end

return "OK"
