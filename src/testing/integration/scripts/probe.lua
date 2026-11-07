---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")
local payload = cjson.decode(ARGV[1])

if payload.action == "pair" then
    local first, second = state.pair(payload.value)
    return cjson.encode({first or false, second or false})
elseif payload.action == "available" then
    local from = payload.from == "now" and state.now or payload.from
    local until_time = payload.untilTime == "now" and state.now or payload.untilTime
    return state.available(tostring(from) .. ":" .. tostring(until_time)) and 1 or 0
elseif payload.action == "expiry" then
    local deadline = state.expiry(payload.value)
    return deadline == math.huge and "+inf" or tostring(deadline)
elseif payload.action == "targets" then
    return cjson.encode(projection_materializer.targets(payload.script, payload.input))
elseif payload.action == "materialize" then
    projection_materializer.materialize(payload.targets)
    return "OK"
elseif payload.action == "revoke" then
    redis.call("HSET", state.key("role", payload.realm, payload.role), "isRevoked", "1")
    return "OK"
end

return state.key("realm", payload.realm)
