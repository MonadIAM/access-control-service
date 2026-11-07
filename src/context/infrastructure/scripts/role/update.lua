---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm = tostring(payload.realm)
local is_revoked = payload.isRevoked == true and "1" or "0"

for _, role in ipairs(payload.roles or {}) do
    role = tostring(role)
    redis.call("HSET", state.key("role", realm, role), "isRevoked", is_revoked)
    redis.call("SADD", state.key("realm-roles", realm), role)
end

return "OK"
