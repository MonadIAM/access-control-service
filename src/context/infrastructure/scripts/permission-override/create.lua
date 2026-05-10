---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function is_active_entity(key)
    return redis.call("HGET", key, "isRevoked") == "0"
end

local function activate_override(realm_id, account_id, permission_id, effect)
    if effect == "ALLOW" then
        redis.call("SADD", make_key("account-overrides-allow", realm_id, account_id), permission_id)
        redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
    elseif effect == "DENY" then
        redis.call("SADD", make_key("account-overrides-deny", realm_id, account_id), permission_id)
        redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
    else
        return
    end

    redis.call("SADD", make_key("permission-override-accounts", realm_id, permission_id), account_id)
    redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
    redis.call("SADD", make_key("account-realms", account_id), realm_id)
end

for _, item in ipairs(payload.items or {}) do
    local permission_id = tostring(item.permission)
    local version = tonumber(item.version) or 1
    local override_id = tostring(item.override)
    local effect = tostring(item.effect or "")
    local account_id = tostring(item.account)
    local realm_id = tostring(item.realm)

    redis.call("HSET", make_key("permission-override", realm_id, account_id, permission_id),
        "overrideId", override_id,
        "isRevoked", "0",
        "version", version,
        "effect", effect
    )

    redis.call("SADD", make_key("permission-overrides", "by-account", realm_id, account_id), permission_id)
    redis.call("SADD", make_key("permission-overrides", "by-permission", realm_id, permission_id), account_id)

    if is_active_entity(make_key("realm", realm_id))
        and is_active_entity(make_key("permission", realm_id, permission_id)) then
        activate_override(realm_id, account_id, permission_id, effect)
    end
end

return "OK"
