---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function to_redis_bool(value)
    return value and "1" or "0"
end

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function mark_active_entity(bucket, realm_id, entity_id)
    bucket[realm_id] = bucket[realm_id] or {}
    bucket[realm_id][entity_id] = true
end

local function is_active_entity(bucket, realm_id, entity_id)
    return bucket[realm_id] ~= nil and bucket[realm_id][entity_id] == true
end

local active_entities = {
    permissions = {},
    realms = {},
    roles = {}
}

for _, realm in ipairs(payload.realms or {}) do
    local version = tonumber(realm.version) or 1
    local is_revoked = realm.is_revoked
    local realm_id = tostring(realm.id)

    redis.call("HSET", make_key("realm", realm_id),
        "isRevoked", to_redis_bool(is_revoked),
        "version", version
    )

    if not is_revoked then
        active_entities.realms[realm_id] = true
    end
end

for _, role in ipairs(payload.roles or {}) do
    local version = tonumber(role.version) or 1
    local realm_id = tostring(role.realm_id)
    local is_revoked = role.is_revoked
    local role_id = tostring(role.id)

    redis.call("HSET", make_key("role", realm_id, role_id),
        "isRevoked", to_redis_bool(is_revoked),
        "version", version
    )

    redis.call("SADD", make_key("realm-roles", realm_id), role_id)

    if active_entities.realms[realm_id] and not is_revoked then
        mark_active_entity(active_entities.roles, realm_id, role_id)
    end
end

for _, permission in ipairs(payload.permissions or {}) do
    local version = tonumber(permission.version) or 1
    local realm_id = tostring(permission.realm_id)
    local permission_id = tostring(permission.id)
    local code = tostring(permission.code or "")
    local is_revoked = permission.is_revoked

    redis.call("HSET", make_key("permission", realm_id, permission_id),
        "isRevoked", to_redis_bool(is_revoked),
        "version", version,
        "code", code
    )

    redis.call("HSET", make_key("permission-code-by-id", realm_id), permission_id, code)

    if active_entities.realms[realm_id] and not is_revoked then
        mark_active_entity(active_entities.permissions, realm_id, permission_id)
    end
end

for _, closure in ipairs(payload.roleClosures or {}) do
    local descendant_id = tostring(closure.descendant_id)
    local ancestor_id = tostring(closure.ancestor_id)
    local version = tonumber(closure.version) or 1
    local realm_id = tostring(closure.realm_id)
    local depth = tonumber(closure.depth) or 0

    redis.call("HSET", make_key("role-closure", realm_id, ancestor_id, descendant_id),
        "depth", tostring(depth),
        "version", version
    )

    redis.call("ZADD", make_key("role-ancestors", realm_id, descendant_id), depth, ancestor_id)
    redis.call("ZADD", make_key("role-descendants", realm_id, ancestor_id), depth, descendant_id)
end

for _, assignment in ipairs(payload.rolePermissionAssignments or {}) do
    local permission_id = tostring(assignment.permission_id)
    local permission_realm_id = tostring(assignment.permission_realm_id or assignment.permissionRealm or assignment.realm_id)
    local version = tonumber(assignment.version) or 1
    local scope = tostring(assignment.scope or "")
    local realm_id = tostring(assignment.realm_id)
    local assignment_id = tostring(assignment.id)
    local role_id = tostring(assignment.role_id)
    local is_revoked = assignment.is_revoked

    redis.call("HSET", make_key("role-permission-assignment", realm_id, role_id, permission_id),
        "assignmentId", assignment_id,
        "isRevoked", to_redis_bool(is_revoked),
        "version", version,
        "scope", scope,
        "permissionRealm", permission_realm_id
    )

    redis.call("SADD", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
    redis.call("SADD", make_key("role-permission-assignments", "by-permission", realm_id, permission_id), role_id)
    redis.call("SADD", make_key("permission-usages", "role-assignments", permission_realm_id, permission_id), realm_id .. ":" .. role_id)

    if active_entities.realms[realm_id]
        and is_active_entity(active_entities.roles, realm_id, role_id)
        and is_active_entity(active_entities.permissions, permission_realm_id, permission_id)
        and not is_revoked then
        redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
        redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
    end
end

for _, assignment in ipairs(payload.accountRoleAssignments or {}) do
    local version = tonumber(assignment.version) or 1
    local account_id = tostring(assignment.account)
    local realm_id = tostring(assignment.realm_id)
    local assignment_id = tostring(assignment.id)
    local role_id = tostring(assignment.role_id)
    local is_revoked = assignment.is_revoked

    redis.call("HSET", make_key("account-role-assignment", realm_id, account_id, role_id),
        "assignmentId", assignment_id,
        "isRevoked", to_redis_bool(is_revoked),
        "version", version
    )

    redis.call("SADD", make_key("account-role-assignments", "by-account", realm_id, account_id), role_id)
    redis.call("SADD", make_key("account-role-assignments", "by-role", realm_id, role_id), account_id)

    if active_entities.realms[realm_id]
        and is_active_entity(active_entities.roles, realm_id, role_id)
        and not is_revoked then
        redis.call("SADD", make_key("account-roles", realm_id, account_id), role_id)
        redis.call("SADD", make_key("role-accounts", realm_id, role_id), account_id)
        redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
        redis.call("SADD", make_key("account-realms", account_id), realm_id)
    end
end

for _, override in ipairs(payload.permissionOverrides or {}) do
    local permission_id = tostring(override.permission_id)
    local permission_realm_id = tostring(override.permission_realm_id or override.permissionRealm or override.realm_id)
    local version = tonumber(override.version) or 1
    local effect = tostring(override.effect or "")
    local account_id = tostring(override.account)
    local realm_id = tostring(override.realm_id)
    local override_id = tostring(override.id)
    local is_revoked = override.is_revoked

    redis.call("HSET", make_key("permission-override", realm_id, account_id, permission_id),
        "overrideId", override_id,
        "isRevoked", to_redis_bool(is_revoked),
        "version", version,
        "effect", effect,
        "permissionRealm", permission_realm_id
    )

    redis.call("SADD", make_key("permission-overrides", "by-account", realm_id, account_id), permission_id)
    redis.call("SADD", make_key("permission-overrides", "by-permission", realm_id, permission_id), account_id)
    redis.call("SADD", make_key("permission-usages", "overrides", permission_realm_id, permission_id), realm_id .. ":" .. account_id)

    if active_entities.realms[realm_id]
        and is_active_entity(active_entities.permissions, permission_realm_id, permission_id)
        and not is_revoked then
        if effect == "ALLOW" then
            redis.call("SADD", make_key("account-overrides-allow", realm_id, account_id), permission_id)
        elseif effect == "DENY" then
            redis.call("SADD", make_key("account-overrides-deny", realm_id, account_id), permission_id)
        end

        if effect == "ALLOW" or effect == "DENY" then
            redis.call("SADD", make_key("permission-override-accounts", realm_id, permission_id), account_id)
            redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
            redis.call("SADD", make_key("account-realms", account_id), realm_id)
        end
    end
end

redis.call("SET", make_key("state"), "READY")

return "OK"
