---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])
local is_revoked = payload.isRevoked == true

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function redis_bool(value)
    return value and "1" or "0"
end

local function is_active_entity(key)
    return redis.call("HGET", key, "isRevoked") == "0"
end

local function remove_active_override(realm_id, account_id, permission_id)
    redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
    redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
    redis.call("SREM", make_key("permission-override-accounts", realm_id, permission_id), account_id)
end

for _, item in ipairs(payload.realms or {}) do
    local realm_id = tostring(item.realm)
    local version = tonumber(item.version) or 1

    redis.call("HSET", make_key("realm", realm_id),
        "isRevoked", redis_bool(is_revoked),
        "version", version
    )

    local role_ids = redis.call("SMEMBERS", make_key("realm-roles", realm_id))
    local permission_ids = redis.call("HKEYS", make_key("permission-code-by-id", realm_id))

    if is_revoked then
        local account_ids = redis.call("SMEMBERS", make_key("realm-accounts", realm_id))

        for _, account_id in ipairs(account_ids) do
            redis.call("SREM", make_key("account-realms", account_id), realm_id)
            redis.call("UNLINK", make_key("account-roles", realm_id, account_id))
            redis.call("UNLINK", make_key("account-overrides-allow", realm_id, account_id))
            redis.call("UNLINK", make_key("account-overrides-deny", realm_id, account_id))
        end

        for _, role_id in ipairs(role_ids) do
            redis.call("UNLINK", make_key("role-accounts", realm_id, role_id))
            redis.call("UNLINK", make_key("role-permissions", realm_id, role_id))
        end

        for _, permission_id in ipairs(permission_ids) do
            redis.call("UNLINK", make_key("permission-roles", realm_id, permission_id))
            redis.call("UNLINK", make_key("permission-override-accounts", realm_id, permission_id))
        end

        redis.call("UNLINK", make_key("realm-accounts", realm_id))
    else
        for _, role_id in ipairs(role_ids) do
            if is_active_entity(make_key("role", realm_id, role_id)) then
                local account_ids = redis.call("SMEMBERS", make_key("account-role-assignments", "by-role", realm_id, role_id))

                for _, account_id in ipairs(account_ids) do
                    local assignment_key = make_key("account-role-assignment", realm_id, account_id, role_id)

                    if redis.call("HGET", assignment_key, "isRevoked") == "0" then
                        redis.call("SADD", make_key("account-roles", realm_id, account_id), role_id)
                        redis.call("SADD", make_key("role-accounts", realm_id, role_id), account_id)
                        redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
                        redis.call("SADD", make_key("account-realms", account_id), realm_id)
                    end
                end

                local assigned_permission_ids = redis.call("SMEMBERS", make_key("role-permission-assignments", "by-role", realm_id, role_id))

                for _, permission_id in ipairs(assigned_permission_ids) do
                    local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)

                    if redis.call("HGET", assignment_key, "isRevoked") == "0"
                        and is_active_entity(make_key("permission", realm_id, permission_id)) then
                        redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
                        redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
                    end
                end
            end
        end

        for _, permission_id in ipairs(permission_ids) do
            if is_active_entity(make_key("permission", realm_id, permission_id)) then
                local account_ids = redis.call("SMEMBERS", make_key("permission-overrides", "by-permission", realm_id, permission_id))

                for _, account_id in ipairs(account_ids) do
                    local override_key = make_key("permission-override", realm_id, account_id, permission_id)
                    local override_is_revoked = redis.call("HGET", override_key, "isRevoked")
                    local effect = redis.call("HGET", override_key, "effect")

                    if override_is_revoked == "0" then
                        if effect == "ALLOW" then
                            redis.call("SADD", make_key("account-overrides-allow", realm_id, account_id), permission_id)
                            redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
                        elseif effect == "DENY" then
                            redis.call("SADD", make_key("account-overrides-deny", realm_id, account_id), permission_id)
                            redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
                        else
                            remove_active_override(realm_id, account_id, permission_id)
                        end

                        if effect == "ALLOW" or effect == "DENY" then
                            redis.call("SADD", make_key("permission-override-accounts", realm_id, permission_id), account_id)
                            redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
                            redis.call("SADD", make_key("account-realms", account_id), realm_id)
                        end
                    else
                        remove_active_override(realm_id, account_id, permission_id)
                    end
                end
            end
        end
    end
end

return "OK"
