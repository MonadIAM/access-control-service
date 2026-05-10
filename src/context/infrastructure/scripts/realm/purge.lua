---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local accounts = {}

local function remember_account(account_id)
    accounts[account_id] = true
end

for _, realm in ipairs(payload.realms or {}) do
    local realm_id = tostring(realm)

    local active_account_ids = redis.call("SMEMBERS", make_key("realm-accounts", realm_id))
    for _, account_id in ipairs(active_account_ids) do
        remember_account(account_id)
    end

    local role_ids = redis.call("SMEMBERS", make_key("realm-roles", realm_id))
    local permission_ids = redis.call("HKEYS", make_key("permission-code-by-id", realm_id))

    for _, role_id in ipairs(role_ids) do
        local account_ids = redis.call("SMEMBERS", make_key("account-role-assignments", "by-role", realm_id, role_id))
        for _, account_id in ipairs(account_ids) do
            remember_account(account_id)

            redis.call("UNLINK", make_key("account-role-assignment", realm_id, account_id, role_id))
            redis.call("SREM", make_key("account-role-assignments", "by-account", realm_id, account_id), role_id)
            redis.call("SREM", make_key("account-role-assignments", "by-role", realm_id, role_id), account_id)
            redis.call("SREM", make_key("account-roles", realm_id, account_id), role_id)
            redis.call("SREM", make_key("role-accounts", realm_id, role_id), account_id)
        end

        local assigned_permission_ids = redis.call("SMEMBERS", make_key("role-permission-assignments", "by-role", realm_id, role_id))
        for _, permission_id in ipairs(assigned_permission_ids) do
            redis.call("UNLINK", make_key("role-permission-assignment", realm_id, role_id, permission_id))
            redis.call("SREM", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
            redis.call("SREM", make_key("role-permission-assignments", "by-permission", realm_id, permission_id), role_id)
            redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
            redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)
        end

        local descendant_ids = redis.call("ZRANGE", make_key("role-descendants", realm_id, role_id), 0, -1)
        for _, descendant_id in ipairs(descendant_ids) do
            redis.call("UNLINK", make_key("role-closure", realm_id, role_id, descendant_id))
            redis.call("ZREM", make_key("role-ancestors", realm_id, descendant_id), role_id)
        end

        local ancestor_ids = redis.call("ZRANGE", make_key("role-ancestors", realm_id, role_id), 0, -1)
        for _, ancestor_id in ipairs(ancestor_ids) do
            redis.call("UNLINK", make_key("role-closure", realm_id, ancestor_id, role_id))
            redis.call("ZREM", make_key("role-descendants", realm_id, ancestor_id), role_id)
        end

        redis.call("UNLINK", make_key("role", realm_id, role_id))
        redis.call("UNLINK", make_key("role-accounts", realm_id, role_id))
        redis.call("UNLINK", make_key("role-permissions", realm_id, role_id))
        redis.call("UNLINK", make_key("role-ancestors", realm_id, role_id))
        redis.call("UNLINK", make_key("role-descendants", realm_id, role_id))
        redis.call("UNLINK", make_key("account-role-assignments", "by-role", realm_id, role_id))
        redis.call("UNLINK", make_key("role-permission-assignments", "by-role", realm_id, role_id))
    end

    for _, permission_id in ipairs(permission_ids) do
        local role_ids_by_permission = redis.call("SMEMBERS", make_key("role-permission-assignments", "by-permission", realm_id, permission_id))
        for _, role_id in ipairs(role_ids_by_permission) do
            redis.call("UNLINK", make_key("role-permission-assignment", realm_id, role_id, permission_id))
            redis.call("SREM", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
            redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
            redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)
        end

        local account_ids = redis.call("SMEMBERS", make_key("permission-overrides", "by-permission", realm_id, permission_id))
        for _, account_id in ipairs(account_ids) do
            remember_account(account_id)

            redis.call("UNLINK", make_key("permission-override", realm_id, account_id, permission_id))
            redis.call("SREM", make_key("permission-overrides", "by-account", realm_id, account_id), permission_id)
            redis.call("SREM", make_key("permission-overrides", "by-permission", realm_id, permission_id), account_id)
            redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
            redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
            redis.call("SREM", make_key("permission-override-accounts", realm_id, permission_id), account_id)
        end

        redis.call("UNLINK", make_key("permission", realm_id, permission_id))
        redis.call("HDEL", make_key("permission-code-by-id", realm_id), permission_id)
        redis.call("UNLINK", make_key("permission-roles", realm_id, permission_id))
        redis.call("UNLINK", make_key("permission-override-accounts", realm_id, permission_id))
        redis.call("UNLINK", make_key("role-permission-assignments", "by-permission", realm_id, permission_id))
        redis.call("UNLINK", make_key("permission-overrides", "by-permission", realm_id, permission_id))
    end

    for account_id, _ in pairs(accounts) do
        redis.call("SREM", make_key("account-realms", account_id), realm_id)
        redis.call("UNLINK", make_key("account-roles", realm_id, account_id))
        redis.call("UNLINK", make_key("account-overrides-allow", realm_id, account_id))
        redis.call("UNLINK", make_key("account-overrides-deny", realm_id, account_id))
        redis.call("UNLINK", make_key("account-role-assignments", "by-account", realm_id, account_id))
        redis.call("UNLINK", make_key("permission-overrides", "by-account", realm_id, account_id))
    end

    redis.call("UNLINK", make_key("realm", realm_id))
    redis.call("UNLINK", make_key("realm-roles", realm_id))
    redis.call("UNLINK", make_key("realm-accounts", realm_id))
    redis.call("UNLINK", make_key("permission-code-by-id", realm_id))
end

return "OK"
