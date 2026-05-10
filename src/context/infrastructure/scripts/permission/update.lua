---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

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

local function maybe_remove_account_realm(realm_id, account_id)
    local active_roles_count = redis.call("SCARD", make_key("account-roles", realm_id, account_id))
    local active_allow_count = redis.call("SCARD", make_key("account-overrides-allow", realm_id, account_id))
    local active_deny_count = redis.call("SCARD", make_key("account-overrides-deny", realm_id, account_id))

    if active_roles_count == 0 and active_allow_count == 0 and active_deny_count == 0 then
        redis.call("SREM", make_key("realm-accounts", realm_id), account_id)
        redis.call("SREM", make_key("account-realms", account_id), realm_id)
    end
end

local cleanup_pairs = {}

local function schedule_cleanup(realm_id, account_id)
    cleanup_pairs[realm_id .. ":" .. account_id] = {realm_id, account_id}
end

local is_revoked = payload.isRevoked == true
local realm_id = tostring(payload.realm)

for _, item in ipairs(payload.permissions or {}) do
    local permission_id = tostring(item.permission)
    local version = tonumber(item.version) or 1

    redis.call("HSET", make_key("permission", realm_id, permission_id),
        "isRevoked", redis_bool(is_revoked),
        "version", version
    )

    local role_ids = redis.call("SMEMBERS", make_key("role-permission-assignments", "by-permission", realm_id, permission_id))
    local account_ids = redis.call("SMEMBERS", make_key("permission-overrides", "by-permission", realm_id, permission_id))

    if is_revoked then
        for _, role_id in ipairs(role_ids) do
            redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
            redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)
        end

        for _, account_id in ipairs(account_ids) do
            remove_active_override(realm_id, account_id, permission_id)
            schedule_cleanup(realm_id, account_id)
        end
    else
        if is_active_entity(make_key("realm", realm_id)) then
            for _, role_id in ipairs(role_ids) do
                local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)

                if is_active_entity(make_key("role", realm_id, role_id))
                    and redis.call("HGET", assignment_key, "isRevoked") == "0" then
                    redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
                    redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
                else
                    redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
                    redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)
                end
            end

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
                        schedule_cleanup(realm_id, account_id)
                    end

                    if effect == "ALLOW" or effect == "DENY" then
                        redis.call("SADD", make_key("permission-override-accounts", realm_id, permission_id), account_id)
                        redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
                        redis.call("SADD", make_key("account-realms", account_id), realm_id)
                    end
                else
                    remove_active_override(realm_id, account_id, permission_id)
                    schedule_cleanup(realm_id, account_id)
                end
            end
        end
    end
end

for _, pair in pairs(cleanup_pairs) do
    maybe_remove_account_realm(pair[1], pair[2])
end

return "OK"
