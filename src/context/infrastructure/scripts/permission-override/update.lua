---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function to_redis_bool(value)
    return value and "1" or "0"
end

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

for _, item in ipairs(payload.items or {}) do
    local is_revoked = to_redis_bool(payload.isRevoked)
    local permission_id = tostring(item.permission)
    local version = tonumber(item.version) or 1
    local override_id = tostring(item.override)
    local effect = tostring(item.effect or "")
    local account_id = tostring(item.account)
    local realm_id = tostring(item.realm)

    redis.call("HSET", make_key("permission-override", realm_id, account_id, permission_id),
        "overrideId", override_id,
        "isRevoked", is_revoked,
        "version", version,
        "effect", effect
    )

    if is_revoked then
        redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
        redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
        redis.call("SREM", make_key("permission-override-accounts", realm_id, permission_id), account_id)

        local active_roles_count = redis.call("SCARD", make_key("account-roles", realm_id, account_id))
        local active_allow_count = redis.call("SCARD", make_key("account-overrides-allow", realm_id, account_id))
        local active_deny_count = redis.call("SCARD", make_key("account-overrides-deny", realm_id, account_id))

        if active_roles_count == 0 and active_allow_count == 0 and active_deny_count == 0 then
            redis.call("SREM", make_key("realm-accounts", realm_id), account_id)
            redis.call("SREM", make_key("account-realms", account_id), realm_id)
        end
    else
        local realm_is_revoked = redis.call("HGET", make_key("realm", realm_id), "isRevoked")
        local permission_is_revoked = redis.call("HGET", make_key("permission", realm_id, permission_id), "isRevoked")

        if realm_is_revoked == "0" and permission_is_revoked == "0" then
            if effect == "ALLOW" then
                redis.call("SADD", make_key("account-overrides-allow", realm_id, account_id), permission_id)
                redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
            elseif effect == "DENY" then
                redis.call("SADD", make_key("account-overrides-deny", realm_id, account_id), permission_id)
                redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
            end

            redis.call("SADD", make_key("permission-override-accounts", realm_id, permission_id), account_id)
            redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
            redis.call("SADD", make_key("account-realms", account_id), realm_id)
        end
    end
end

return "OK"
