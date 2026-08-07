---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local account_id = tostring(payload.account)

local candidate_realm_ids = redis.call("SMEMBERS", make_key("account-realms", account_id))
local result = {}

for _, realm_id in ipairs(candidate_realm_ids) do
    if redis.call("SCARD", make_key("account-roles", realm_id, account_id)) > 0 then
        table.insert(result, realm_id)
    end
end

return cjson.encode(result)
