---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local payload = cjson.decode(ARGV[1])
local account = tostring(payload.account)
local realm = tostring(payload.realm)

local deadline = state.score(state.key("effective-realms", account), realm)

return cjson.encode(deadline > state.now)
