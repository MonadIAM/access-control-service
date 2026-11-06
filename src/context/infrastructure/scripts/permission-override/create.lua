---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm = tostring(payload.realm)
local account = tostring(payload.account)
local permission = tostring(payload.permission)
local owner = tostring(payload.permissionRealm)

redis.call("HSET", state.key("permission-override", realm, account, permission),
    "overrideId", tostring(payload.override),
    "isRevoked", "0",
    "effect", tostring(payload.effect),
    "permissionRealm", owner,
    "expiresAt", state.stored_expiry(payload.expiresAt)
)
redis.call("SADD", state.key("permission-overrides", "by-account", realm, account), permission)
redis.call("SADD", state.key("permission-overrides", "by-realm", realm), account .. ":" .. permission)
redis.call("SADD", state.key("permission-usages", "overrides", owner, permission), realm .. ":" .. account)

return "OK"
