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

local function purge_role(realm_id, role_id)
    local role_accounts_key = make_key("role-accounts", realm_id, role_id)
    local role_permissions_key = make_key("role-permissions", realm_id, role_id)
    local role_ancestors_key = make_key("role-ancestors", realm_id, role_id)
    local role_descendants_key = make_key("role-descendants", realm_id, role_id)

    local account_ids = redis.call("SMEMBERS", make_key("account-role-assignments", "by-role", realm_id, role_id))
    for _, account_id in ipairs(account_ids) do
        redis.call("UNLINK", make_key("account-role-assignment", realm_id, account_id, role_id))
        redis.call("SREM", make_key("account-role-assignments", "by-account", realm_id, account_id), role_id)
        redis.call("SREM", make_key("account-role-assignments", "by-role", realm_id, role_id), account_id)

        redis.call("SREM", make_key("account-roles", realm_id, account_id), role_id)
        redis.call("SREM", role_accounts_key, account_id)

        schedule_cleanup(realm_id, account_id)
    end

    local permission_ids = redis.call("SMEMBERS", make_key("role-permission-assignments", "by-role", realm_id, role_id))
    for _, permission_id in ipairs(permission_ids) do
        redis.call("UNLINK", make_key("role-permission-assignment", realm_id, role_id, permission_id))
        redis.call("SREM", make_key("role-permission-assignments", "by-role", realm_id, role_id), permission_id)
        redis.call("SREM", make_key("role-permission-assignments", "by-permission", realm_id, permission_id), role_id)

        redis.call("SREM", role_permissions_key, permission_id)
        redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)
    end

    local ancestor_ids = redis.call("ZRANGE", role_ancestors_key, 0, -1)
    for _, ancestor_id in ipairs(ancestor_ids) do
        redis.call("UNLINK", make_key("role-closure", realm_id, ancestor_id, role_id))
        redis.call("ZREM", make_key("role-descendants", realm_id, ancestor_id), role_id)
    end

    local descendant_ids = redis.call("ZRANGE", role_descendants_key, 0, -1)
    for _, descendant_id in ipairs(descendant_ids) do
        redis.call("UNLINK", make_key("role-closure", realm_id, role_id, descendant_id))
        redis.call("ZREM", make_key("role-ancestors", realm_id, descendant_id), role_id)
    end

    redis.call("SREM", make_key("realm-roles", realm_id), role_id)

    redis.call("UNLINK", make_key("role", realm_id, role_id))
    redis.call("UNLINK", role_accounts_key)
    redis.call("UNLINK", role_permissions_key)
    redis.call("UNLINK", role_ancestors_key)
    redis.call("UNLINK", role_descendants_key)
    redis.call("UNLINK", make_key("account-role-assignments", "by-role", realm_id, role_id))
    redis.call("UNLINK", make_key("role-permission-assignments", "by-role", realm_id, role_id))
end

local realm_id = tostring(payload.realm)
local root_role_id = tostring(payload.role)

local role_ids
if payload.includeDescendants == true then
    role_ids = redis.call("ZRANGE", make_key("role-descendants", realm_id, root_role_id), 0, -1)
else
    role_ids = { root_role_id }
end

for _, role_id in ipairs(role_ids) do
    purge_role(realm_id, role_id)
end

for _, pair in pairs(cleanup_pairs) do
    maybe_remove_account_realm(pair[1], pair[2])
end

return "OK"
