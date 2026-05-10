---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function to_redis_bool(value)
    return value and "1" or "0"
end

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function scan_keys(pattern)
    local cursor = "0"
    local keys = {}
    repeat
        local result = redis.call("SCAN", cursor, "MATCH", pattern, "COUNT", 1000)
        cursor = result[1]
        for _, key in ipairs(result[2]) do
            table.insert(keys, key)
        end
    until cursor == "0"
    return keys
end

local function extract_middle_value(key, prefix, suffix)
    local value = string.sub(key, string.len(prefix) + 1)
    if string.len(suffix) > 0 then
        return string.sub(value, 1, string.len(value) - string.len(suffix))
    else
        return value
    end
end

local function extract_tail_value(key, prefix)
    return string.sub(key, string.len(prefix) + 1)
end

local realm_id = tostring(payload.realm)
local is_revoked = payload.isRevoked == true

for _, item in ipairs(payload.roles or {}) do
    local role_id = tostring(item.role)
    local version = tonumber(item.version) or 1

    local role_key = make_key("role", realm_id, role_id)
    local role_accounts_key = make_key("role-accounts", realm_id, role_id)
    local role_permissions_key = make_key("role-permissions", realm_id, role_id)

    redis.call("HSET", role_key, "isRevoked", to_redis_bool(is_revoked), "version", version)

    if is_revoked then
        local account_ids = redis.call("SMEMBERS", role_accounts_key)

        for _, account_id in ipairs(account_ids) do
            local acc_roles_key = make_key("account-roles", realm_id, account_id)
            local acc_allow_key = make_key("account-overrides-allow", realm_id, account_id)
            local acc_deny_key = make_key("account-overrides-deny", realm_id, account_id)

            redis.call("SREM", acc_roles_key, role_id)

            local active_roles_count = redis.call("SCARD", acc_roles_key)
            local active_allow_count = redis.call("SCARD", acc_allow_key)
            local active_deny_count = redis.call("SCARD", acc_deny_key)

            if active_roles_count == 0 and active_allow_count == 0 and active_deny_count == 0 then
                redis.call("SREM", make_key("realm-accounts", realm_id), account_id)
                redis.call("SREM", make_key("account-realms", account_id), realm_id)
            end
        end

        local permission_ids = redis.call("SMEMBERS", role_permissions_key)
        for _, permission_id in ipairs(permission_ids) do
            redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)
        end

        redis.call("UNLINK", role_accounts_key)
        redis.call("UNLINK", role_permissions_key)
    else
        local realm_is_revoked_status = redis.call("HGET", make_key("realm", realm_id), "isRevoked")

        if realm_is_revoked_status == "0" then
            local acc_assign_prefix = make_key("account-role-assignment", realm_id, "")
            local acc_assign_suffix = ":" .. role_id
            local account_assignment_keys = scan_keys(acc_assign_prefix .. "*" .. acc_assign_suffix)

            for _, assignment_key in ipairs(account_assignment_keys) do
                local account_id = extract_middle_value(assignment_key, acc_assign_prefix, acc_assign_suffix)
                local assignment_is_revoked = redis.call("HGET", assignment_key, "isRevoked")

                if assignment_is_revoked == "0" then
                    redis.call("SADD", make_key("account-roles", realm_id, account_id), role_id)
                    redis.call("SADD", role_accounts_key, account_id)
                    redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
                    redis.call("SADD", make_key("account-realms", account_id), realm_id)
                end
            end

            local perm_assign_prefix = make_key("role-permission-assignment", realm_id, role_id, "")
            local permission_assignment_keys = scan_keys(perm_assign_prefix .. "*")

            for _, assignment_key in ipairs(permission_assignment_keys) do
                local permission_id = extract_tail_value(assignment_key, perm_assign_prefix)
                local assignment_is_revoked = redis.call("HGET", assignment_key, "isRevoked")
                local perm_is_revoked = redis.call("HGET", make_key("permission", realm_id, permission_id), "isRevoked")

                if assignment_is_revoked == "0" and perm_is_revoked == "0" then
                    redis.call("SADD", role_permissions_key, permission_id)
                    redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
                end
            end
        end
    end
end

return "OK"
