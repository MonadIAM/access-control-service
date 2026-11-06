---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local is_revoked = payload.isRevoked == true and "1" or "0"

for _, item in ipairs(payload.items or {}) do
    local realm = tostring(item.realm)
    local account = tostring(item.account)
    local permission = tostring(item.permission)
    local owner = tostring(item.permissionRealm)

    redis.call("HSET", state.key("permission-override", realm, account, permission),
        "overrideId", tostring(item.override),
        "isRevoked", is_revoked,
        "effect", tostring(item.effect),
        "permissionRealm", owner,
        "expiresAt", state.stored_expiry(item.expiresAt)
    )
    redis.call("SADD", state.key("permission-overrides", "by-account", realm, account), permission)
    redis.call("SADD", state.key("permission-overrides", "by-realm", realm), account .. ":" .. permission)
    redis.call("SADD", state.key("permission-usages", "overrides", owner, permission), realm .. ":" .. account)
end

return "OK"
