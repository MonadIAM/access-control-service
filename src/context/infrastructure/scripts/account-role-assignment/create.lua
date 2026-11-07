---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm = tostring(payload.realm)
local account = tostring(payload.account)

for _, item in ipairs(payload.assignments or {}) do
    local role = tostring(item.role)

    redis.call("HSET", state.key("account-role-assignment", realm, account, role),
        "assignmentId", tostring(item.assignment),
        "isRevoked", "0",
        "expiresAt", state.stored_expiry(item.expiresAt)
    )
    redis.call("SADD", state.key("account-role-assignments", "by-account", realm, account), role)
    redis.call("SADD", state.key("account-role-assignments", "by-role", realm, role), account)
end

return "OK"
