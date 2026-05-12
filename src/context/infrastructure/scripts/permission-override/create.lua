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

local permission_realm_id = tostring(payload.permissionRealm)
local permission_id = tostring(payload.permission)
local override_id = tostring(payload.override)
local account_id = tostring(payload.account)
local realm_id = tostring(payload.realm)
local effect = tostring(payload.effect)

redis.call("HSET", make_key("permission-override", realm_id, account_id, permission_id),
    "overrideId", override_id,
    "isRevoked", "0",
    "effect", effect,
    "permissionRealm", permission_realm_id
)

redis.call("SADD", make_key("permission-overrides", "by-account", realm_id, account_id), permission_id)
redis.call("SADD", make_key("permission-overrides", "by-permission", realm_id, permission_id), account_id)
redis.call("SADD", make_key("permission-overrides", "by-realm", realm_id), account_id .. ":" .. permission_id)
redis.call("SADD", make_key("permission-usages", "overrides", permission_realm_id, permission_id), realm_id .. ":" .. account_id)

if is_active_entity(make_key("realm", realm_id))
    and is_active_entity(make_key("permission", permission_realm_id, permission_id)) then
    activate_override(realm_id, account_id, permission_id, effect)
end

return "OK"
