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

for _, realm in ipairs(payload.realms or {}) do
    local realm_id = tostring(realm)
    local realm_accounts_key = make_key("realm-accounts", realm_id)

    local account_ids = redis.call("SMEMBERS", realm_accounts_key)
    for _, account_id in ipairs(account_ids) do
        redis.call("SREM", make_key("account-realms", account_id), realm_id)
    end

    redis.call("UNLINK", make_key("realm", realm_id))
    redis.call("UNLINK", make_key("permission-code-by-id", realm_id))
    redis.call("UNLINK", realm_accounts_key)

    delete_keys_by_pattern(make_key("role", realm_id, "*"))
    delete_keys_by_pattern(make_key("permission", realm_id, "*"))

    delete_keys_by_pattern(make_key("role-closure", realm_id, "*"))
    delete_keys_by_pattern(make_key("role-ancestors", realm_id, "*"))
    delete_keys_by_pattern(make_key("role-descendants", realm_id, "*"))

    delete_keys_by_pattern(make_key("role-permission-assignment", realm_id, "*"))
    delete_keys_by_pattern(make_key("role-permissions", realm_id, "*"))
    delete_keys_by_pattern(make_key("permission-roles", realm_id, "*"))

    delete_keys_by_pattern(make_key("account-role-assignment", realm_id, "*"))
    delete_keys_by_pattern(make_key("account-roles", realm_id, "*"))
    delete_keys_by_pattern(make_key("role-accounts", realm_id, "*"))

    delete_keys_by_pattern(make_key("permission-override", realm_id, "*"))
    delete_keys_by_pattern(make_key("account-overrides-allow", realm_id, "*"))
    delete_keys_by_pattern(make_key("account-overrides-deny", realm_id, "*"))
    delete_keys_by_pattern(make_key("permission-override-accounts", realm_id, "*"))
end

return "OK"
