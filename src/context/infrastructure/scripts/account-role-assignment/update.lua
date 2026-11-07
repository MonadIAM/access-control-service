---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local is_revoked = payload.isRevoked == true and "1" or "0"

for _, item in ipairs(payload.items or {}) do
    local realm = tostring(item.realm)
    local account = tostring(item.account)
    local role = tostring(item.role)

    redis.call("HSET", state.key("account-role-assignment", realm, account, role),
        "assignmentId", tostring(item.assignment),
        "isRevoked", is_revoked,
        "expiresAt", state.stored_expiry(item.expiresAt)
    )
    redis.call("SADD", state.key("account-role-assignments", "by-account", realm, account), role)
    redis.call("SADD", state.key("account-role-assignments", "by-role", realm, role), account)
end

return "OK"
