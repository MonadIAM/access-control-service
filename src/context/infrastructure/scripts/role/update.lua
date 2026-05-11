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

local function maybe_remove_account_realm(realm_id, account_id)
    local active_roles_count = redis.call("SCARD", make_key("account-roles", realm_id, account_id))
    local active_allow_count = redis.call("SCARD", make_key("account-overrides-allow", realm_id, account_id))
    local active_deny_count = redis.call("SCARD", make_key("account-overrides-deny", realm_id, account_id))

    if active_roles_count == 0 and active_allow_count == 0 and active_deny_count == 0 then
        redis.call("SREM", make_key("realm-accounts", realm_id), account_id)
        redis.call("SREM", make_key("account-realms", account_id), realm_id)
    end
end

local function remove_role_permission(realm_id, role_id, permission_id)
    redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
    redis.call("SREM", make_key("role-permissions-global", realm_id, role_id), permission_id)
    redis.call("SREM", make_key("permission-roles", realm_id, permission_id), role_id)
end

local function activate_role_permission(realm_id, role_id, permission_id, scope)
    if scope == "GLOBAL" then
        redis.call("SADD", make_key("role-permissions-global", realm_id, role_id), permission_id)
    elseif scope == "REALM" then
        redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
    else
        remove_role_permission(realm_id, role_id, permission_id)
        return
    end

    redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
end

local cleanup_pairs = {}

local function schedule_cleanup(realm_id, account_id)
    cleanup_pairs[realm_id .. ":" .. account_id] = {realm_id, account_id}
end

local realm_id = tostring(payload.realm)
local is_revoked = payload.isRevoked == true

for _, role in ipairs(payload.roles or {}) do
    local role_id = tostring(role)

    local role_key = make_key("role", realm_id, role_id)
    local role_accounts_key = make_key("role-accounts", realm_id, role_id)

    redis.call("HSET", role_key, "isRevoked", redis_bool(is_revoked))
    redis.call("SADD", make_key("realm-roles", realm_id), role_id)

    local account_ids = redis.call("SMEMBERS", make_key("account-role-assignments", "by-role", realm_id, role_id))
    local permission_ids = redis.call("SMEMBERS", make_key("role-permission-assignments", "by-role", realm_id, role_id))

    if is_revoked then
        for _, account_id in ipairs(account_ids) do
            redis.call("SREM", make_key("account-roles", realm_id, account_id), role_id)
            redis.call("SREM", role_accounts_key, account_id)
            schedule_cleanup(realm_id, account_id)
        end

        for _, permission_id in ipairs(permission_ids) do
            remove_role_permission(realm_id, role_id, permission_id)
        end
    else
        if is_active_entity(make_key("realm", realm_id)) then
            for _, account_id in ipairs(account_ids) do
                local assignment_key = make_key("account-role-assignment", realm_id, account_id, role_id)
                local assignment_is_revoked = redis.call("HGET", assignment_key, "isRevoked")

                if assignment_is_revoked == "0" then
                    redis.call("SADD", make_key("account-roles", realm_id, account_id), role_id)
                    redis.call("SADD", role_accounts_key, account_id)
                    redis.call("SADD", make_key("realm-accounts", realm_id), account_id)
                    redis.call("SADD", make_key("account-realms", account_id), realm_id)
                else
                    redis.call("SREM", make_key("account-roles", realm_id, account_id), role_id)
                    redis.call("SREM", role_accounts_key, account_id)
                    schedule_cleanup(realm_id, account_id)
                end
            end

            for _, permission_id in ipairs(permission_ids) do
                local assignment_key = make_key("role-permission-assignment", realm_id, role_id, permission_id)
                local permission_realm_id = redis.call("HGET", assignment_key, "permissionRealm") or realm_id
                local assignment_is_revoked = redis.call("HGET", assignment_key, "isRevoked")
                local scope = redis.call("HGET", assignment_key, "scope") or ""

                if assignment_is_revoked == "0"
                    and is_active_entity(make_key("permission", permission_realm_id, permission_id)) then
                    activate_role_permission(realm_id, role_id, permission_id, scope)
                else
                    remove_role_permission(realm_id, role_id, permission_id)
                end
            end
        else
            for _, account_id in ipairs(account_ids) do
                redis.call("SREM", make_key("account-roles", realm_id, account_id), role_id)
                redis.call("SREM", role_accounts_key, account_id)
                schedule_cleanup(realm_id, account_id)
            end

            for _, permission_id in ipairs(permission_ids) do
                remove_role_permission(realm_id, role_id, permission_id)
            end
        end
    end
end

for _, pair in pairs(cleanup_pairs) do
    maybe_remove_account_realm(pair[1], pair[2])
end

return "OK"
