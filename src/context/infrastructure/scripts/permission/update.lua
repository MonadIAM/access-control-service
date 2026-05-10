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

local is_revoked = to_redis_bool(payload.isRevoked)
local realm_id = tostring(payload.realm)

for _, item in ipairs(payload.permissions or {}) do
    local permission_id = tostring(item.permission)
    local version = tonumber(item.version) or 1
    local permission_key = make_key("permission", realm_id, permission_id)

    redis.call("HSET", permission_key,
        "isRevoked", to_redis_bool(is_revoked),
        "version", version
    )

    if is_revoked then
        local role_ids = redis.call("SMEMBERS", make_key("permission-roles", realm_id, permission_id))
        for _, role_id in ipairs(role_ids) do
            redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
        end

        local account_ids = redis.call("SMEMBERS", make_key("permission-override-accounts", realm_id, permission_id))
        for _, account_id in ipairs(account_ids) do
            redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
            redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
        end

        redis.call("UNLINK", make_key("permission-roles", realm_id, permission_id))
        redis.call("UNLINK", make_key("permission-override-accounts", realm_id, permission_id))
    else
        local realm_is_revoked = redis.call("HGET", make_key("realm", realm_id), "isRevoked")

        if realm_is_revoked == "0" then
            local assign_prefix = make_key("role-permission-assignment", realm_id, "")
            local assign_suffix = ":" .. permission_id
            local assignment_keys = scan_keys(assign_prefix .. "*" .. assign_suffix)

            for _, assignment_key in ipairs(assignment_keys) do
                local role_id = extract_middle_value(assignment_key, assign_prefix, assign_suffix)
                local role_is_revoked = redis.call("HGET", make_key("role", realm_id, role_id), "isRevoked")
                local assignment_is_revoked = redis.call("HGET", assignment_key, "isRevoked")

                if assignment_is_revoked == "0" and role_is_revoked == "0" then
                    redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
                    redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
                end
            end

            local override_prefix = make_key("permission-override", realm_id, "")
            local override_suffix = ":" .. permission_id
            local override_keys = scan_keys(override_prefix .. "*" .. override_suffix)

            for _, override_key in ipairs(override_keys) do
                local account_id = extract_middle_value(override_key, override_prefix, override_suffix)
                local override_is_revoked = redis.call("HGET", override_key, "isRevoked")
                local effect = redis.call("HGET", override_key, "effect")

                if override_is_revoked == "0" then
                    if effect == "ALLOW" then
                        redis.call("SADD", make_key("account-overrides-allow", realm_id, account_id), permission_id)
                    elseif effect == "DENY" then
                        redis.call("SADD", make_key("account-overrides-deny", realm_id, account_id), permission_id)
                    end

                    redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
                    redis.call("SADD", make_key("account-realms", account_id), realm_id)
                    redis.call("SADD", make_key("permission-override-accounts", realm_id, permission_id), account_id)
                end
            end
        end
    end
end

return "OK"
