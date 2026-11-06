---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm = tostring(payload.realm)
local role = tostring(payload.role)

for _, item in ipairs(payload.assignments or {}) do
    local permission = tostring(item.permission)
    local owner = tostring(item.permissionRealm)

    redis.call("HSET", state.key("role-permission-assignments", realm, role),
        permission .. ":assignmentId", tostring(item.assignment),
        permission .. ":isRevoked", "0",
        permission .. ":scope", tostring(item.scope),
        permission .. ":permissionRealm", owner
    )
    redis.call("SADD", state.key("permission-usages", "role-assignments", owner, permission), realm .. ":" .. role)
end

return "OK"
