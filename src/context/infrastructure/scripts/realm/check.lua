---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local account_id = tostring(payload.account)
local realm_id = tostring(payload.realm)

return cjson.encode(redis.call("SCARD", make_key("account-roles", realm_id, account_id)) > 0)
