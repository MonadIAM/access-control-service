---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
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

for _, item in ipairs(payload.items or {}) do
    local permission_id = tostring(item.permission)
    local account_id = tostring(item.account)
    local realm_id = tostring(item.realm)

    local override_key = make_key("permission-override", realm_id, account_id, permission_id)
    local stored_permission_realm = redis.call("HGET", override_key, "permissionRealm")
    local permission_realm_id = tostring(item.permissionRealm or item.permission_realm or stored_permission_realm or realm_id)

    redis.call("UNLINK", override_key)

    redis.call("SREM", make_key("permission-overrides", "by-account", realm_id, account_id), permission_id)
    redis.call("SREM", make_key("permission-overrides", "by-permission", realm_id, permission_id), account_id)
    redis.call("SREM", make_key("permission-usages", "overrides", permission_realm_id, permission_id), realm_id .. ":" .. account_id)

    redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
    redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
    redis.call("SREM", make_key("permission-override-accounts", realm_id, permission_id), account_id)

    schedule_cleanup(realm_id, account_id)
end

for _, pair in pairs(cleanup_pairs) do
    maybe_remove_account_realm(pair[1], pair[2])
end

return "OK"
