---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function to_redis_bool(value)
    return value and "1" or "0"
end

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local realm_version = tonumber(payload.realm.version) or 1
local realm_id = tostring(payload.realm.realm)

redis.call("HSET", make_key("realm", realm_id),
    "isRevoked", to_redis_bool(false),
    "version", realm_version
)

for _, item in ipairs(payload.roles or {}) do
    local role_id = tostring(item.role)
    local version = tonumber(item.version) or 1

    redis.call("HSET", make_key("role", realm_id, role_id),
        "isRevoked", to_redis_bool(false),
        "version", version
    )
end

for _, item in ipairs(payload.paths or {}) do
    local ancestor_id = tostring(item.ancestor)
    local descendant_id = tostring(item.descendant)
    local version = tonumber(item.version) or 1
    local depth = tonumber(item.depth) or 0

    redis.call("HSET", make_key("role-closure", realm_id, ancestor_id, descendant_id),
        "depth", tostring(depth),
        "version", version
    )

    redis.call("ZADD", make_key("role-ancestors", realm_id, descendant_id), depth, ancestor_id)
    redis.call("ZADD", make_key("role-descendants", realm_id, ancestor_id), depth, descendant_id)
end

for _, item in ipairs(payload.rolePermissionAssignments or {}) do
    local assignment_id = tostring(item.assignment)
    local permission_id = tostring(item.permission)
    local role_id = tostring(item.role)
    local version = tonumber(item.version) or 1
    local scope = tostring(item.scope or "")

    redis.call("HSET", make_key("role-permission-assignment", realm_id, role_id, permission_id),
        "assignmentId", assignment_id,
        "isRevoked", to_redis_bool(false),
        "version", version,
        "scope", scope
    )

    redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
    redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
end

for _, item in ipairs(payload.accountRoleAssignments or {}) do
    local assignment_id = tostring(item.assignment)
    local account_id = tostring(item.account)
    local role_id = tostring(item.role)
    local version = tonumber(item.version) or 1

    redis.call("HSET", make_key("account-role-assignment", realm_id, account_id, role_id),
        "assignmentId", assignment_id,
        "isRevoked", to_redis_bool(false),
        "version", version
    )

    redis.call("SADD", make_key("account-roles", realm_id, account_id), role_id)
    redis.call("SADD", make_key("role-accounts", realm_id, role_id), account_id)
    redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
    redis.call("SADD", make_key("account-realms", account_id), realm_id)
end

return "OK"
