---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

for _, item in ipairs(payload.items or {}) do
    local realm = tostring(item.realm)
    local account = tostring(item.account)
    local permission = tostring(item.permission)
    local key = state.key("permission-override", realm, account, permission)
    local owner = redis.call("HGET", key, "permissionRealm") or tostring(item.permissionRealm)

    redis.call("UNLINK", key)
    redis.call("SREM", state.key("permission-overrides", "by-account", realm, account), permission)
    redis.call("SREM", state.key("permission-overrides", "by-realm", realm), account .. ":" .. permission)
    redis.call("SREM", state.key("permission-usages", "overrides", owner, permission), realm .. ":" .. account)
end

return "OK"
