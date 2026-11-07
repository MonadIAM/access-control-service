---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm_id = tostring(payload.realm)
local role_ids = redis.call("SMEMBERS", state.key("realm-roles", realm_id))
local permission_ids = redis.call("HVALS", state.key("permission-id-by-code", realm_id))

for _, role_id in ipairs(role_ids) do
    local account_ids = redis.call("SMEMBERS", state.key("account-role-assignments", "by-role", realm_id, role_id))

    for _, account_id in ipairs(account_ids) do
        redis.call("UNLINK", state.key("account-role-assignment", realm_id, account_id, role_id))
        redis.call("SREM", state.key("account-role-assignments", "by-account", realm_id, account_id), role_id)
    end

    local assignment_key = state.key("role-permission-assignments", realm_id, role_id)
    local fields = redis.call("HGETALL", assignment_key)

    for index = 1, #fields, 2 do
        local permission_id, attribute = state.pair(fields[index])

        if attribute == "permissionRealm" then
            redis.call(
                "SREM",
                state.key("permission-usages", "role-assignments", fields[index + 1], permission_id),
                realm_id .. ":" .. role_id
            )
        end
    end

    redis.call(
        "UNLINK",
        state.key("role", realm_id, role_id),
        state.key("role-ancestors", realm_id, role_id),
        state.key("role-descendants", realm_id, role_id),
        state.key("account-role-assignments", "by-role", realm_id, role_id),
        assignment_key
    )
end

local override_ids = redis.call("SMEMBERS", state.key("permission-overrides", "by-realm", realm_id))

for _, override_id in ipairs(override_ids) do
    local account_id, permission_id = state.pair(override_id)

    if account_id and permission_id then
        local override_key = state.key("permission-override", realm_id, account_id, permission_id)
        local permission_realm_id = redis.call("HGET", override_key, "permissionRealm") or realm_id

        redis.call("UNLINK", override_key)
        redis.call("SREM", state.key("permission-overrides", "by-account", realm_id, account_id), permission_id)
        redis.call(
            "SREM",
            state.key("permission-usages", "overrides", permission_realm_id, permission_id),
            realm_id .. ":" .. account_id
        )
    end
end

for _, permission_id in ipairs(permission_ids) do
    local role_usage_ids = redis.call(
        "SMEMBERS",
        state.key("permission-usages", "role-assignments", realm_id, permission_id)
    )

    for _, usage_id in ipairs(role_usage_ids) do
        local target_realm_id, role_id = state.pair(usage_id)

        if target_realm_id and role_id then
            redis.call("HDEL", state.key("role-permission-assignments", target_realm_id, role_id),
                permission_id .. ":assignmentId",
                permission_id .. ":isRevoked",
                permission_id .. ":scope",
                permission_id .. ":permissionRealm"
            )
        end
    end

    local override_usage_ids = redis.call(
        "SMEMBERS",
        state.key("permission-usages", "overrides", realm_id, permission_id)
    )

    for _, usage_id in ipairs(override_usage_ids) do
        local target_realm_id, account_id = state.pair(usage_id)

        if target_realm_id and account_id then
            redis.call("UNLINK", state.key("permission-override", target_realm_id, account_id, permission_id))
            redis.call(
                "SREM",
                state.key("permission-overrides", "by-account", target_realm_id, account_id),
                permission_id
            )
            redis.call(
                "SREM",
                state.key("permission-overrides", "by-realm", target_realm_id),
                account_id .. ":" .. permission_id
            )
        end
    end

    redis.call(
        "UNLINK",
        state.key("permission-usages", "role-assignments", realm_id, permission_id),
        state.key("permission-usages", "overrides", realm_id, permission_id)
    )
end

redis.call(
    "UNLINK",
    state.key("realm", realm_id),
    state.key("realm-roles", realm_id),
    state.key("permission-id-by-code", realm_id),
    state.key("permissions", realm_id),
    state.key("permission-overrides", "by-realm", realm_id)
)

return "OK"
