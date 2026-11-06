---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm = tostring(payload.realm)
local is_revoked = payload.isRevoked == true and "1" or "0"

for _, permission in ipairs(payload.permissions or {}) do
    redis.call("HSET", state.key("permissions", realm), tostring(permission) .. ":isRevoked", is_revoked)
end

return "OK"
