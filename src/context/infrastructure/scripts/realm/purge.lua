---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local accounts = {}

local function remember_account(account_id)
    accounts[account_id] = true
end

do
    local realm_id = tostring(payload.realm)
    accounts = {}

    local active_account_ids = redis.call("SMEMBERS", make_key("realm-accounts", realm_id))
    for _, account_id in ipairs(active_account_ids) do
        remember_account(account_id)
    end

    local role_ids = redis.call("SMEMBERS", make_key("realm-roles", realm_id))
    local permission_ids = redis.call("HVALS", make_key("permission-id-by-code", realm_id))

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
            local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)
            local permission_realm_id = redis.call("HGET", assignment_key, "permissionRealm") or realm_id

            redis.call("UNLINK", assignment_key)
            redis.call("SREM", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
            redis.call("SREM", make_key("role-permission-assignments", "by-permission", realm_id, permission_id), role_id)
            redis.call("SREM", make_key("permission-usages", "role-assignments", permission_realm_id, permission_id), realm_id .. ":" .. role_id)
            redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
            redis.call("SREM", make_key("role-permissions-global", realm_id, role_id), permission_id)
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
        redis.call("UNLINK", make_key("role-permissions-global", realm_id, role_id))
        redis.call("UNLINK", make_key("role-ancestors", realm_id, role_id))
        redis.call("UNLINK", make_key("role-descendants", realm_id, role_id))
        redis.call("UNLINK", make_key("account-role-assignments", "by-role", realm_id, role_id))
        redis.call("UNLINK", make_key("role-permission-assignments", "by-role", realm_id, role_id))
    end

    local override_ids = redis.call("SMEMBERS", make_key("permission-overrides", "by-realm", realm_id))
    for _, override_id in ipairs(override_ids) do
        local account_id, permission_id = string.match(override_id, "^([^:]+):([^:]+)$")

        if account_id and permission_id then
            remember_account(account_id)

            local override_key = make_key("permission-override", realm_id, account_id, permission_id)
            local permission_realm_id = redis.call("HGET", override_key, "permissionRealm") or realm_id

            redis.call("UNLINK", override_key)
            redis.call("SREM", make_key("permission-overrides", "by-account", realm_id, account_id), permission_id)
            redis.call("SREM", make_key("permission-overrides", "by-permission", realm_id, permission_id), account_id)
            redis.call("SREM", make_key("permission-overrides", "by-realm", realm_id), account_id .. ":" .. permission_id)
            redis.call("SREM", make_key("permission-usages", "overrides", permission_realm_id, permission_id), realm_id .. ":" .. account_id)
            redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
            redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
            redis.call("SREM", make_key("permission-override-accounts", realm_id, permission_id), account_id)
        end
    end

    for _, permission_id in ipairs(permission_ids) do
        redis.call("UNLINK", make_key("permission", realm_id, permission_id))
        redis.call("UNLINK", make_key("permission-roles", realm_id, permission_id))
        redis.call("UNLINK", make_key("permission-override-accounts", realm_id, permission_id))
        redis.call("UNLINK", make_key("role-permission-assignments", "by-permission", realm_id, permission_id))
        redis.call("UNLINK", make_key("permission-overrides", "by-permission", realm_id, permission_id))
        redis.call("UNLINK", make_key("permission-usages", "role-assignments", realm_id, permission_id))
        redis.call("UNLINK", make_key("permission-usages", "overrides", realm_id, permission_id))
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
    redis.call("UNLINK", make_key("permission-id-by-code", realm_id))
    redis.call("UNLINK", make_key("permission-code-by-id", realm_id))
    redis.call("UNLINK", make_key("permission-overrides", "by-realm", realm_id))
end

return "OK"
