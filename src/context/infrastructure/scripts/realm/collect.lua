---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local payload = cjson.decode(ARGV[1])
local realms = redis.call(
    "ZRANGEBYSCORE",
    state.key("effective-realms", tostring(payload.account)),
    "(" .. tostring(state.now),
    "+inf"
)
return #realms == 0 and "[]" or cjson.encode(realms)
