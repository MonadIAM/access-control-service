---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function is_active_entity(key)
    return redis.call("HGET", key, "isRevoked") == "0"
end

local function activate_role_permission(realm_id, role_id, permission_id, scope)
    if scope == "GLOBAL" then
        redis.call("SADD", make_key("role-permissions-global", realm_id, role_id), permission_id)
    elseif scope == "REALM" then
        redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
    else
        return
    end

    redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
end

local realm_id = tostring(payload.realm)
local permission_realm_id = tostring(payload.permissionRealm or realm_id)

redis.call("HSET", make_key("realm", realm_id), "isRevoked", "0")

for _, role in ipairs(payload.roles or {}) do
    local role_id = tostring(role)

    redis.call("HSET", make_key("role", realm_id, role_id), "isRevoked", "0")
    redis.call("SADD", make_key("realm-roles", realm_id), role_id)
end

for _, item in ipairs(payload.paths or {}) do
    local ancestor_id = tostring(item.ancestor)
    local descendant_id = tostring(item.descendant)
    local depth = tonumber(item.depth) or 0

    redis.call("HSET", make_key("role-closure", realm_id, ancestor_id, descendant_id),
        "depth", tostring(depth)
    )

    redis.call("ZADD", make_key("role-ancestors", realm_id, descendant_id), depth, ancestor_id)
    redis.call("ZADD", make_key("role-descendants", realm_id, ancestor_id), depth, descendant_id)
end

for _, item in ipairs(payload.rolePermissionAssignments or {}) do
    local assignment_id = tostring(item.assignment)
    local permission_id = tostring(item.permission)
    local scope = tostring(item.scope or "")
    local role_id = tostring(item.role)

    redis.call("HSET", make_key("role-permission-assignment", realm_id, role_id, permission_id),
        "assignmentId", assignment_id,
        "isRevoked", "0",
        "scope", scope,
        "permissionRealm", permission_realm_id
    )

    redis.call("SADD", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
    redis.call("SADD", make_key("role-permission-assignments", "by-permission", realm_id, permission_id), role_id)
    redis.call("SADD", make_key("permission-usages", "role-assignments", permission_realm_id, permission_id), realm_id .. ":" .. role_id)

    if is_active_entity(make_key("permission", permission_realm_id, permission_id)) then
        activate_role_permission(realm_id, role_id, permission_id, scope)
    end
end

for _, item in ipairs(payload.accountRoleAssignments or {}) do
    local assignment_id = tostring(item.assignment)
    local account_id = tostring(item.account)
    local role_id = tostring(item.role)

    redis.call("HSET", make_key("account-role-assignment", realm_id, account_id, role_id),
        "assignmentId", assignment_id,
        "isRevoked", "0"
    )

    redis.call("SADD", make_key("account-role-assignments", "by-account", realm_id, account_id), role_id)
    redis.call("SADD", make_key("account-role-assignments", "by-role", realm_id, role_id), account_id)

    redis.call("SADD", make_key("account-roles", realm_id, account_id), role_id)
    redis.call("SADD", make_key("role-accounts", realm_id, role_id), account_id)
    redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
    redis.call("SADD", make_key("account-realms", account_id), realm_id)
end

return "OK"
