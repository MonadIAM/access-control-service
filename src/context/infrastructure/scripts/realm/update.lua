---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm = tostring(payload.realm)
local is_revoked = payload.isRevoked == true and "1" or "0"

redis.call("HSET", state.key("realm", realm), "isRevoked", is_revoked)

return "OK"
