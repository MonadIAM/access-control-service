---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

for _, item in ipairs(payload.items or {}) do
    local realm = tostring(item.realm)
    local role = tostring(item.role)
    local permission = tostring(item.permission)
    local key = state.key("role-permission-assignments", realm, role)
    local owner = redis.call("HGET", key, permission .. ":permissionRealm") or tostring(item.permissionRealm)

    redis.call("HDEL", key,
        permission .. ":assignmentId",
        permission .. ":isRevoked",
        permission .. ":scope",
        permission .. ":permissionRealm"
    )
    redis.call("SREM", state.key("permission-usages", "role-assignments", owner, permission), realm .. ":" .. role)
end

return "OK"
