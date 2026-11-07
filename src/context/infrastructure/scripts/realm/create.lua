---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local permission_realm_id = tostring(payload.permissionRealm)
local realm_id = tostring(payload.realm)

redis.call("HSET", state.key("realm", realm_id), "isRevoked", "0")

for _, role in ipairs(payload.roles or {}) do
    local role_id = tostring(role)

    redis.call("HSET", state.key("role", realm_id, role_id), "isRevoked", "0")
    redis.call("SADD", state.key("realm-roles", realm_id), role_id)
end

for _, item in ipairs(payload.paths or {}) do
    local descendant_id = tostring(item.descendant)
    local ancestor_id = tostring(item.ancestor)
    local depth = tonumber(item.depth)

    redis.call("ZADD", state.key("role-ancestors", realm_id, descendant_id), depth, ancestor_id)
    redis.call("ZADD", state.key("role-descendants", realm_id, ancestor_id), depth, descendant_id)
end

for _, item in ipairs(payload.rolePermissionAssignments or {}) do
    local assignment_id = tostring(item.assignment)
    local permission_id = tostring(item.permission)
    local role_id = tostring(item.role)
    local scope = tostring(item.scope)

    redis.call("HSET", state.key("role-permission-assignments", realm_id, role_id),
        permission_id .. ":assignmentId", assignment_id,
        permission_id .. ":isRevoked", "0",
        permission_id .. ":scope", scope,
        permission_id .. ":permissionRealm", permission_realm_id
    )

    redis.call(
        "SADD",
        state.key("permission-usages", "role-assignments", permission_realm_id, permission_id),
        realm_id .. ":" .. role_id
    )
end

for _, item in ipairs(payload.accountRoleAssignments or {}) do
    local assignment_id = tostring(item.assignment)
    local account_id = tostring(item.account)
    local role_id = tostring(item.role)

    redis.call("HSET", state.key("account-role-assignment", realm_id, account_id, role_id),
        "assignmentId", assignment_id,
        "isRevoked", "0",
        "expiresAt", state.stored_expiry(item.expiresAt)
    )

    redis.call("SADD", state.key("account-role-assignments", "by-account", realm_id, account_id), role_id)
    redis.call("SADD", state.key("account-role-assignments", "by-role", realm_id, role_id), account_id)
end

return "OK"
