---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local account_id = tostring(payload.account)
local realm_id = tostring(payload.realm)

if redis.call("SCARD", make_key("account-roles", realm_id, account_id)) > 0 then
    return 1
end

return 0
