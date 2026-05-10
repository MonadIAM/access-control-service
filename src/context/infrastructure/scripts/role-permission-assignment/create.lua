---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function is_active_entity(key)
    return redis.call("HGET", key, "isRevoked") == "0"
end

local realm_id = tostring(payload.realm)
local role_id = tostring(payload.role)

local realm_active = is_active_entity(make_key("realm", realm_id))
local role_active = is_active_entity(make_key("role", realm_id, role_id))

local all_by_role_key = make_key("role-permission-assignments", "by-role", realm_id, role_id)

for _, item in ipairs(payload.assignments or {}) do
    local assignment_id = tostring(item.assignment)
    local permission_id = tostring(item.permission)
    local version = tonumber(item.version) or 1
    local scope = tostring(item.scope or "")

    local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)
    local all_by_permission_key = make_key("role-permission-assignments", "by-permission", realm_id, permission_id)

    redis.call("HSET", assignment_key,
        "assignmentId", assignment_id,
        "isRevoked", "0",
        "version", version,
        "scope", scope
    )

    redis.call("SADD", all_by_role_key, permission_id)
    redis.call("SADD", all_by_permission_key, role_id)

    if realm_active and role_active and is_active_entity(make_key("permission", realm_id, permission_id)) then
        redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
        redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
    end
end

return "OK"
