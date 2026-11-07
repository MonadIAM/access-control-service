---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

for _, item in ipairs(payload.items or {}) do
    local realm = tostring(item.realm)
    local account = tostring(item.account)
    local role = tostring(item.role)

    redis.call("UNLINK", state.key("account-role-assignment", realm, account, role))
    redis.call("SREM", state.key("account-role-assignments", "by-account", realm, account), role)
    redis.call("SREM", state.key("account-role-assignments", "by-role", realm, role), account)
end

return "OK"
