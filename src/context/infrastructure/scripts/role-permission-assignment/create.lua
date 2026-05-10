---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local realm_id = tostring(payload.realm)
local role_id = tostring(payload.role)

local realm_is_revoked = redis.call("HGET", make_key("realm", realm_id), "isRevoked")
local role_is_revoked = redis.call("HGET", make_key("role", realm_id, role_id), "isRevoked")

for _, item in ipairs(payload.assignments or {}) do
    local assignment_id = tostring(item.assignment)
    local permission_id = tostring(item.permission)
    local version = tonumber(item.version) or 1
    local scope = tostring(item.scope or "")

    redis.call("HSET", make_key("role-permission-assignment", realm_id, role_id, permission_id),
        "assignmentId", assignment_id,
        "isRevoked", "0",
        "version", version,
        "scope", scope
    )

    local permission_is_revoked = redis.call("HGET", make_key("permission", realm_id, permission_id), "isRevoked")

    if realm_is_revoked == "0" and role_is_revoked == "0" and permission_is_revoked == "0" then
        redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
        redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
    end
end

return "OK"
