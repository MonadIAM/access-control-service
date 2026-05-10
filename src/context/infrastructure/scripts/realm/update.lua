---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local is_revoked = payload.isRevoked == true

local function to_redis_bool(value)
    return value and "1" or "0"
end

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function delete_keys_by_pattern(pattern)
    local cursor = "0"
    repeat
        local result = redis.call("SCAN", cursor, "MATCH", pattern, "COUNT", 1000)
        cursor = result[1]
        for _, key in ipairs(result[2]) do
            redis.call("UNLINK", key)
        end
    until cursor == "0"
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

local function extract_tail_value(key, prefix)
    return string.sub(key, string.len(prefix) + 1)
end

local function parse_pair(value)
    local first, second = string.match(value, "^([^:]+):([^:]+)$")
    return first, second
end

local function get_permission_realm(entity_key, realm_id)
    local permission_realm = redis.call("HGET", entity_key, "permissionRealm")
    return permission_realm or realm_id
end

for _, item in ipairs(payload.realms or {}) do
    local realm_id = tostring(item.realm)
    local version = tonumber(item.version) or 1
    local realm_key = make_key("realm", realm_id)
    local realm_accounts_key = make_key("realm-accounts", realm_id)

    redis.call("HSET", realm_key, "isRevoked", to_redis_bool(is_revoked), "version", version)

    if is_revoked then
        local account_ids = redis.call("SMEMBERS", realm_accounts_key)
        for _, account_id in ipairs(account_ids) do
            redis.call("SREM", make_key("account-realms", account_id), realm_id)
        end

        redis.call("UNLINK", realm_accounts_key)

        delete_keys_by_pattern(make_key("account-roles", realm_id, "*"))
        delete_keys_by_pattern(make_key("role-accounts", realm_id, "*"))
        delete_keys_by_pattern(make_key("role-permissions", realm_id, "*"))
        delete_keys_by_pattern(make_key("permission-roles", realm_id, "*"))
        delete_keys_by_pattern(make_key("account-overrides-allow", realm_id, "*"))
        delete_keys_by_pattern(make_key("account-overrides-deny", realm_id, "*"))
        delete_keys_by_pattern(make_key("permission-override-accounts", realm_id, "*"))
    else
        local acc_role_prefix = make_key("account-role-assignment", realm_id, "")
        local acc_role_keys = scan_keys(acc_role_prefix .. "*")

        for _, assignment_key in ipairs(acc_role_keys) do
            local tail = extract_tail_value(assignment_key, acc_role_prefix)
            local account_id, role_id = parse_pair(tail)

            if account_id and role_id then
                local assignment_is_revoked = redis.call("HGET", assignment_key, "isRevoked")
                local role_is_revoked = redis.call("HGET", make_key("role", realm_id, role_id), "isRevoked")

                if assignment_is_revoked == "0" and role_is_revoked == "0" then
                    redis.call("SADD", make_key("account-roles", realm_id, account_id), role_id)
                    redis.call("SADD", make_key("role-accounts", realm_id, role_id), account_id)
                    redis.call("SADD", realm_accounts_key, account_id)
                    redis.call("SADD", make_key("account-realms", account_id), realm_id)
                end
            end
        end

        local role_perm_prefix = make_key("role-permission-assignment", realm_id, "")
        local role_perm_keys = scan_keys(role_perm_prefix .. "*")

        for _, assignment_key in ipairs(role_perm_keys) do
            local tail = extract_tail_value(assignment_key, role_perm_prefix)
            local role_id, permission_id = parse_pair(tail)

            if role_id and permission_id then
                local assignment_is_revoked = redis.call("HGET", assignment_key, "isRevoked")
                local role_is_revoked = redis.call("HGET", make_key("role", realm_id, role_id), "isRevoked")
                local perm_realm_id = get_permission_realm(assignment_key, realm_id)
                local perm_is_revoked = redis.call("HGET", make_key("permission", perm_realm_id, permission_id), "isRevoked")

                if assignment_is_revoked == "0" and role_is_revoked == "0" and perm_is_revoked == "0" then
                    redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
                    redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
                end
            end
        end

        local override_prefix = make_key("permission-override", realm_id, "")
        local override_keys = scan_keys(override_prefix .. "*")

        for _, override_key in ipairs(override_keys) do
            local tail = extract_tail_value(override_key, override_prefix)
            local account_id, permission_id = parse_pair(tail)

            if account_id and permission_id then
                local override_is_revoked = redis.call("HGET", override_key, "isRevoked")
                local effect = redis.call("HGET", override_key, "effect")
                local perm_realm_id = get_permission_realm(override_key, realm_id)
                local perm_is_revoked = redis.call("HGET", make_key("permission", perm_realm_id, permission_id), "isRevoked")

                if override_is_revoked == "0" and perm_is_revoked == "0" then
                    if effect == "ALLOW" then
                        redis.call("SADD", make_key("account-overrides-allow", realm_id, account_id), permission_id)
                    elseif effect == "DENY" then
                        redis.call("SADD", make_key("account-overrides-deny", realm_id, account_id), permission_id)
                    end

                    redis.call("SADD", make_key("permission-override-accounts", realm_id, permission_id), account_id)
                    redis.call("SADD", realm_accounts_key, account_id)
                    redis.call("SADD", make_key("account-realms", account_id), realm_id)
                end
            end
        end
    end
end

return "OK"
