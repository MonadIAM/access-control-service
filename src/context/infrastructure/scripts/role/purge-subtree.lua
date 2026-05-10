---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

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

local function extract_tail_value(key, prefix)
    return string.sub(key, string.len(prefix) + 1)
end

local realm_id = tostring(payload.realm)
local root_role_id = tostring(payload.role)

local subtree_role_ids = redis.call("ZRANGE", make_key("role-descendants", realm_id, root_role_id), 0, -1)

for _, role_id in ipairs(subtree_role_ids) do
    local role_accounts_key = make_key("role-accounts", realm_id, role_id)
    local role_permissions_key = make_key("role-permissions", realm_id, role_id)
    local role_ancestors_key = make_key("role-ancestors", realm_id, role_id)
    local role_descendants_key = make_key("role-descendants", realm_id, role_id)

    local acc_assign_prefix = make_key("account-role-assignment", realm_id, "")
    local acc_assign_suffix = ":" .. role_id
    local account_assignment_keys = scan_keys(acc_assign_prefix .. "*" .. acc_assign_suffix)

    for _, assignment_key in ipairs(account_assignment_keys) do
        local account_id = extract_middle_value(assignment_key, acc_assign_prefix, acc_assign_suffix)

        local account_roles_key = make_key("account-roles", realm_id, account_id)
        local account_allow_key = make_key("account-overrides-allow", realm_id, account_id)
        local account_deny_key = make_key("account-overrides-deny", realm_id, account_id)

        redis.call("UNLINK", assignment_key)
        redis.call("SREM", account_roles_key, role_id)
        redis.call("SREM", role_accounts_key, account_id)

        local active_roles_count = redis.call("SCARD", account_roles_key)
        local active_allow_count = redis.call("SCARD", account_allow_key)
        local active_deny_count = redis.call("SCARD", account_deny_key)

        if active_roles_count == 0 and active_allow_count == 0 and active_deny_count == 0 then
            redis.call("SREM", make_key("realm-accounts", realm_id), account_id)
            redis.call("SREM", make_key("account-realms", account_id), realm_id)
        end
    end

    local perm_assign_prefix = make_key("role-permission-assignment", realm_id, role_id, "")
    local permission_assignment_keys = scan_keys(perm_assign_prefix .. "*")

    for _, assignment_key in ipairs(permission_assignment_keys) do
        local permission_id = extract_tail_value(assignment_key, perm_assign_prefix)

        redis.call("UNLINK", assignment_key)
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

    redis.call("UNLINK", make_key("role", realm_id, role_id))
    redis.call("UNLINK", role_accounts_key)
    redis.call("UNLINK", role_permissions_key)
    redis.call("UNLINK", role_ancestors_key)
    redis.call("UNLINK", role_descendants_key)
end

return "OK"
