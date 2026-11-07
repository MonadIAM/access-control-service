---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm = tostring(payload.realm)
local permission = tostring(payload.permission)
local code = tostring(payload.code)

redis.call("HSET", state.key("permissions", realm),
    permission .. ":isRevoked", "0",
    permission .. ":code", code
)
redis.call("HSET", state.key("permission-id-by-code", realm), code, permission)

return "OK"
