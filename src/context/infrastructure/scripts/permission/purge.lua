---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local permission_realm_id = tostring(payload.realm)

for _, permission in ipairs(payload.permissions or {}) do
    local permission_id = tostring(permission)
    local permission_key = state.key("permissions", permission_realm_id)
    local code = redis.call("HGET", permission_key, permission_id .. ":code")

    local role_usage_ids = redis.call(
        "SMEMBERS",
        state.key("permission-usages", "role-assignments", permission_realm_id, permission_id)
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
        state.key("permission-usages", "overrides", permission_realm_id, permission_id)
    )

    local unlink_keys = {
        state.key("permission-usages", "role-assignments", permission_realm_id, permission_id),
        state.key("permission-usages", "overrides", permission_realm_id, permission_id),
    }

    for _, usage_id in ipairs(override_usage_ids) do
        local target_realm_id, account_id = state.pair(usage_id)

        if target_realm_id and account_id then
            table.insert(unlink_keys, state.key("permission-override", target_realm_id, account_id, permission_id))

            if #unlink_keys == 64 then
                redis.call("UNLINK", unpack(unlink_keys))
                unlink_keys = {}
            end

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

    if code then
        redis.call("HDEL", state.key("permission-id-by-code", permission_realm_id), code)
    end

    redis.call("HDEL", permission_key, permission_id .. ":isRevoked", permission_id .. ":code")
    if #unlink_keys > 0 and (#role_usage_ids > 0 or #override_usage_ids > 0) then
        redis.call("UNLINK", unpack(unlink_keys))
    end
end

return "OK"
