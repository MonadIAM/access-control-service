---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local function to_redis_bool(value)
    return value and "1" or "0"
end

for _, realm in ipairs(payload.realms or {}) do
    local is_revoked = realm.is_revoked
    local realm_id = tostring(realm.id)

    redis.call("HSET", state.key("realm", realm_id),
        "isRevoked", to_redis_bool(is_revoked)
    )
end

for _, role in ipairs(payload.roles or {}) do
    local realm_id = tostring(role.realm_id)
    local is_revoked = role.is_revoked
    local role_id = tostring(role.id)

    redis.call("HSET", state.key("role", realm_id, role_id),
        "isRevoked", to_redis_bool(is_revoked)
    )

    redis.call("SADD", state.key("realm-roles", realm_id), role_id)
end

for _, permission in ipairs(payload.permissions or {}) do
    local realm_id = tostring(permission.realm_id)
    local permission_id = tostring(permission.id)
    local is_revoked = permission.is_revoked
    local code = tostring(permission.code)

    redis.call("HSET", state.key("permissions", realm_id),
        permission_id .. ":isRevoked", to_redis_bool(is_revoked),
        permission_id .. ":code", code
    )

    redis.call("HSET", state.key("permission-id-by-code", realm_id), code, permission_id)
end

for _, closure in ipairs(payload.roleClosures or {}) do
    local descendant_id = tostring(closure.descendant_id)
    local ancestor_id = tostring(closure.ancestor_id)
    local realm_id = tostring(closure.realm_id)
    local depth = tonumber(closure.depth)

    redis.call("ZADD", state.key("role-ancestors", realm_id, descendant_id), depth, ancestor_id)
    redis.call("ZADD", state.key("role-descendants", realm_id, ancestor_id), depth, descendant_id)
end

for _, assignment in ipairs(payload.rolePermissionAssignments or {}) do
    local permission_realm_id = tostring(assignment.permission_realm_id)
    local permission_id = tostring(assignment.permission_id)
    local realm_id = tostring(assignment.realm_id)
    local assignment_id = tostring(assignment.id)
    local role_id = tostring(assignment.role_id)
    local is_revoked = assignment.is_revoked
    local scope = tostring(assignment.scope)

    redis.call("HSET", state.key("role-permission-assignments", realm_id, role_id),
        permission_id .. ":assignmentId", assignment_id,
        permission_id .. ":isRevoked", to_redis_bool(is_revoked),
        permission_id .. ":scope", scope,
        permission_id .. ":permissionRealm", permission_realm_id
    )

    redis.call(
        "SADD",
        state.key("permission-usages", "role-assignments", permission_realm_id, permission_id),
        realm_id .. ":" .. role_id
    )
end

for _, assignment in ipairs(payload.accountRoleAssignments or {}) do
    local account_id = tostring(assignment.account)
    local realm_id = tostring(assignment.realm_id)
    local assignment_id = tostring(assignment.id)
    local role_id = tostring(assignment.role_id)
    local is_revoked = assignment.is_revoked

    redis.call("HSET", state.key("account-role-assignment", realm_id, account_id, role_id),
        "assignmentId", assignment_id,
        "isRevoked", to_redis_bool(is_revoked),
        "expiresAt", state.stored_expiry(assignment.expires_at)
    )

    redis.call("SADD", state.key("account-role-assignments", "by-account", realm_id, account_id), role_id)
    redis.call("SADD", state.key("account-role-assignments", "by-role", realm_id, role_id), account_id)
end

for _, override in ipairs(payload.permissionOverrides or {}) do
    local permission_id = tostring(override.permission_id)
    local permission_realm_id = tostring(override.permission_realm_id)
    local account_id = tostring(override.account)
    local realm_id = tostring(override.realm_id)
    local override_id = tostring(override.id)
    local effect = tostring(override.effect)
    local is_revoked = override.is_revoked

    redis.call("HSET", state.key("permission-override", realm_id, account_id, permission_id),
        "overrideId", override_id,
        "isRevoked", to_redis_bool(is_revoked),
        "effect", effect,
        "permissionRealm", permission_realm_id,
        "expiresAt", state.stored_expiry(override.expires_at)
    )

    redis.call("SADD", state.key("permission-overrides", "by-account", realm_id, account_id), permission_id)
    redis.call("SADD", state.key("permission-overrides", "by-realm", realm_id), account_id .. ":" .. permission_id)
    redis.call(
        "SADD",
        state.key("permission-usages", "overrides", permission_realm_id, permission_id),
        realm_id .. ":" .. account_id
    )
end

redis.call("SET", state.key("state"), "READY")

return "OK"
