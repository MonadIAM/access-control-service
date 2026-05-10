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

local function activate_override(realm_id, account_id, permission_id, effect)
    if effect == "ALLOW" then
        redis.call("SADD", make_key("account-overrides-allow", realm_id, account_id), permission_id)
        redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
    elseif effect == "DENY" then
        redis.call("SADD", make_key("account-overrides-deny", realm_id, account_id), permission_id)
        redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
    else
        remove_active_override(realm_id, account_id, permission_id)
        return
    end

    redis.call("SADD", make_key("permission-override-accounts", realm_id, permission_id), account_id)
    redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
    redis.call("SADD", make_key("account-realms", account_id), realm_id)
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

local is_revoked = payload.isRevoked == true
local is_revoked_value = redis_bool(is_revoked)
local cleanup_pairs = {}

local function schedule_cleanup(realm_id, account_id)
    cleanup_pairs[realm_id .. ":" .. account_id] = {realm_id, account_id}
end

for _, item in ipairs(payload.items or {}) do
    local permission_id = tostring(item.permission)
    local version = tonumber(item.version) or 1
    local override_id = tostring(item.override)
    local effect = tostring(item.effect or "")
    local account_id = tostring(item.account)
    local realm_id = tostring(item.realm)

    local override_key = make_key("permission-override", realm_id, account_id, permission_id)
    local stored_permission_realm = redis.call("HGET", override_key, "permissionRealm")
    local permission_realm_id = tostring(item.permissionRealm or item.permission_realm or stored_permission_realm or realm_id)

    redis.call("HSET", override_key,
        "overrideId", override_id,
        "isRevoked", is_revoked_value,
        "version", version,
        "effect", effect,
        "permissionRealm", permission_realm_id
    )

    redis.call("SADD", make_key("permission-overrides", "by-account", realm_id, account_id), permission_id)
    redis.call("SADD", make_key("permission-overrides", "by-permission", realm_id, permission_id), account_id)
    redis.call("SADD", make_key("permission-usages", "overrides", permission_realm_id, permission_id), realm_id .. ":" .. account_id)

    if is_revoked then
        remove_active_override(realm_id, account_id, permission_id)
        schedule_cleanup(realm_id, account_id)
    else
        if is_active_entity(make_key("realm", realm_id))
            and is_active_entity(make_key("permission", permission_realm_id, permission_id)) then
            activate_override(realm_id, account_id, permission_id, effect)
        else
            remove_active_override(realm_id, account_id, permission_id)
            schedule_cleanup(realm_id, account_id)
        end
    end
end

for _, pair in pairs(cleanup_pairs) do
    maybe_remove_account_realm(pair[1], pair[2])
end

return "OK"
