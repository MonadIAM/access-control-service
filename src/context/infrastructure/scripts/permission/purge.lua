---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local function delete_keys_by_pattern(pattern)
    local cursor = "0"

    repeat
        local result = redis.call("SCAN", cursor, "MATCH", pattern, "COUNT", 1000)
        cursor = result[1]
        local keys = result[2]

        for _, key in ipairs(keys) do
            redis.call("UNLINK", key)
        end
    until cursor == "0"
end

local realm_id = tostring(payload.realm)

for _, permission in ipairs(payload.permissions or {}) do
    local permission_id = tostring(permission)

    local role_ids = redis.call("SMEMBERS", make_key("permission-roles", realm_id, permission_id))
    for _, role_id in ipairs(role_ids) do
        redis.call("SREM", make_key("role-permissions", realm_id, role_id), permission_id)
        redis.call("UNLINK", make_key("role-permission-assignment", realm_id, role_id, permission_id))
    end

    local account_ids = redis.call("SMEMBERS", make_key("permission-override-accounts", realm_id, permission_id))
    for _, account_id in ipairs(account_ids) do
        redis.call("SREM", make_key("account-overrides-allow", realm_id, account_id), permission_id)
        redis.call("SREM", make_key("account-overrides-deny", realm_id, account_id), permission_id)
        redis.call("UNLINK", make_key("permission-override", realm_id, account_id, permission_id))
    end

    delete_keys_by_pattern(make_key("role-permission-assignment", realm_id, "*", permission_id))
    delete_keys_by_pattern(make_key("permission-override", realm_id, "*", permission_id))

    redis.call("UNLINK", make_key("permission", realm_id, permission_id))
    redis.call("HDEL", make_key("permission-code-by-id", realm_id), permission_id)
    redis.call("UNLINK", make_key("permission-roles", realm_id, permission_id))
    redis.call("UNLINK", make_key("permission-override-accounts", realm_id, permission_id))
end

return "OK"
