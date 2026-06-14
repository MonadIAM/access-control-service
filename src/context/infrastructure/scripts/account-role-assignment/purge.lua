---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function maybe_remove_account_realm(realm_id, account_id)
    if redis.call("SCARD", make_key("account-roles", realm_id, account_id)) == 0 then
        redis.call("SREM", make_key("realm-accounts", realm_id), account_id)
        redis.call("SREM", make_key("account-realms", account_id), realm_id)
    end
end

local cleanup_pairs = {}

local function schedule_cleanup(realm_id, account_id)
    cleanup_pairs[realm_id .. ":" .. account_id] = {realm_id, account_id}
end

for _, item in ipairs(payload.items or {}) do
    local account_id = tostring(item.account)
    local realm_id = tostring(item.realm)
    local role_id = tostring(item.role)

    redis.call("UNLINK", make_key("account-role-assignment", realm_id, account_id, role_id))

    redis.call("SREM", make_key("account-role-assignments", "by-account", realm_id, account_id), role_id)
    redis.call("SREM", make_key("account-role-assignments", "by-role", realm_id, role_id), account_id)

    redis.call("SREM", make_key("account-roles", realm_id, account_id), role_id)
    redis.call("SREM", make_key("role-accounts", realm_id, role_id), account_id)

    schedule_cleanup(realm_id, account_id)
end

for _, pair in pairs(cleanup_pairs) do
    maybe_remove_account_realm(pair[1], pair[2])
end

return "OK"
