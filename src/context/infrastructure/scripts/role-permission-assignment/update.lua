---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local revoked = payload.isRevoked
local is_revoked = (revoked == true or revoked == 1 or revoked == "1" or revoked == "true") and "1" or "0"

for _, item in ipairs(payload.items or {}) do
    local realm = tostring(item.realm)
    local role = tostring(item.role)
    local permission = tostring(item.permission)
    local owner = tostring(item.permissionRealm)

    redis.call("HSET", state.key("role-permission-assignments", realm, role),
        permission .. ":assignmentId", tostring(item.assignment),
        permission .. ":isRevoked", is_revoked,
        permission .. ":scope", tostring(item.scope),
        permission .. ":permissionRealm", owner
    )
    redis.call("SADD", state.key("permission-usages", "role-assignments", owner, permission), realm .. ":" .. role)
end

return "OK"
