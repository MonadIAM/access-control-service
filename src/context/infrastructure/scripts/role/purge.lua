---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm_id = tostring(payload.realm)

for _, role in ipairs(payload.roles or {}) do
    local role_id = tostring(role)

    local role_ancestors_key = state.key("role-ancestors", realm_id, role_id)
    local role_descendants_key = state.key("role-descendants", realm_id, role_id)

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

    local ancestor_ids = redis.call("ZRANGE", role_ancestors_key, 0, -1)

    for _, ancestor_id in ipairs(ancestor_ids) do
        redis.call("ZREM", state.key("role-descendants", realm_id, ancestor_id), role_id)
    end

    local descendant_ids = redis.call("ZRANGE", role_descendants_key, 0, -1)

    for _, descendant_id in ipairs(descendant_ids) do
        redis.call("ZREM", state.key("role-ancestors", realm_id, descendant_id), role_id)
    end

    redis.call("SREM", state.key("realm-roles", realm_id), role_id)

    redis.call(
        "UNLINK",
        state.key("role", realm_id, role_id),
        role_ancestors_key,
        role_descendants_key,
        state.key("account-role-assignments", "by-role", realm_id, role_id),
        assignment_key
    )
end

for _, path in ipairs(payload.paths or {}) do
    local descendant_id = tostring(path.descendant.id)
    local ancestor_id = tostring(path.ancestor.id)
    local depth = tonumber(path.depth)

    redis.call("ZADD", state.key("role-descendants", realm_id, ancestor_id), depth, descendant_id)
    redis.call("ZADD", state.key("role-ancestors", realm_id, descendant_id), depth, ancestor_id)
end

return "OK"
