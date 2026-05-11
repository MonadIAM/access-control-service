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

local function parse_pair(value)
    local first, second = string.match(value, "^([^:]+):([^:]+)$")
    return first, second
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

local function add_role_permission_by_scope(realm_id, role_id, permission_id, scope)
    if scope == "GLOBAL" then
        redis.call("SADD", make_key("role-permissions-global", realm_id, role_id), permission_id)
        redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
    else
        redis.call("SADD", make_key("role-permissions", realm_id, role_id), permission_id)
        redis.call("SREM", make_key("role-permissions-global", realm_id, role_id), permission_id)
    end

    redis.call("SADD", make_key("permission-roles", realm_id, permission_id), role_id)
end

local cleanup_pairs = {}

local function schedule_cleanup(realm_id, account_id)
    cleanup_pairs[realm_id .. ":" .. account_id] = {realm_id, account_id}
end

local is_revoked = payload.isRevoked == true
local permission_realm_id = tostring(payload.realm)

for _, permission in ipairs(payload.permissions or {}) do
    local permission_id = tostring(permission)

    redis.call("HSET", make_key("permission", permission_realm_id, permission_id),
        "isRevoked", redis_bool(is_revoked)
    )

    local role_usage_ids = redis.call("SMEMBERS", make_key("permission-usages", "role-assignments", permission_realm_id, permission_id))
    local override_usage_ids = redis.call("SMEMBERS", make_key("permission-usages", "overrides", permission_realm_id, permission_id))

    if is_revoked then
        for _, usage_id in ipairs(role_usage_ids) do
            local target_realm_id, role_id = parse_pair(usage_id)

            if target_realm_id and role_id then
                redis.call("SREM", make_key("role-permissions", target_realm_id, role_id), permission_id)
                redis.call("SREM", make_key("role-permissions-global", target_realm_id, role_id), permission_id)
                redis.call("SREM", make_key("permission-roles", target_realm_id, permission_id), role_id)
            end
        end

        for _, usage_id in ipairs(override_usage_ids) do
            local target_realm_id, account_id = parse_pair(usage_id)

            if target_realm_id and account_id then
                remove_active_override(target_realm_id, account_id, permission_id)
                schedule_cleanup(target_realm_id, account_id)
            end
        end
    else
        for _, usage_id in ipairs(role_usage_ids) do
            local target_realm_id, role_id = parse_pair(usage_id)

            if target_realm_id and role_id then
                local assignment_key = make_key("role-permission-assignment", target_realm_id, role_id, permission_id)
                local scope = redis.call("HGET", assignment_key, "scope") or "REALM"

                if is_active_entity(make_key("realm", target_realm_id))
                    and is_active_entity(make_key("role", target_realm_id, role_id))
                    and redis.call("HGET", assignment_key, "isRevoked") == "0" then
                    add_role_permission_by_scope(target_realm_id, role_id, permission_id, scope)
                else
                    redis.call("SREM", make_key("role-permissions", target_realm_id, role_id), permission_id)
                    redis.call("SREM", make_key("role-permissions-global", target_realm_id, role_id), permission_id)
                    redis.call("SREM", make_key("permission-roles", target_realm_id, permission_id), role_id)
                end
            end
        end

        for _, usage_id in ipairs(override_usage_ids) do
            local target_realm_id, account_id = parse_pair(usage_id)

            if target_realm_id and account_id then
                local override_key = make_key("permission-override", target_realm_id, account_id, permission_id)
                local override_is_revoked = redis.call("HGET", override_key, "isRevoked")
                local effect = redis.call("HGET", override_key, "effect")

                if is_active_entity(make_key("realm", target_realm_id))
                    and override_is_revoked == "0" then
                    if effect == "ALLOW" then
                        redis.call("SADD", make_key("account-overrides-allow", target_realm_id, account_id), permission_id)
                        redis.call("SREM", make_key("account-overrides-deny", target_realm_id, account_id), permission_id)
                    elseif effect == "DENY" then
                        redis.call("SADD", make_key("account-overrides-deny", target_realm_id, account_id), permission_id)
                        redis.call("SREM", make_key("account-overrides-allow", target_realm_id, account_id), permission_id)
                    else
                        remove_active_override(target_realm_id, account_id, permission_id)
                        schedule_cleanup(target_realm_id, account_id)
                    end

                    if effect == "ALLOW" or effect == "DENY" then
                        redis.call("SADD", make_key("permission-override-accounts", target_realm_id, permission_id), account_id)
                        redis.call("SADD", make_key("realm-accounts", target_realm_id), account_id)
                        redis.call("SADD", make_key("account-realms", account_id), target_realm_id)
                    end
                else
                    remove_active_override(target_realm_id, account_id, permission_id)
                    schedule_cleanup(target_realm_id, account_id)
                end
            end
        end
    end
end

for _, pair in pairs(cleanup_pairs) do
    maybe_remove_account_realm(pair[1], pair[2])
end

return "OK"
