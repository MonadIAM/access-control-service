---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local permission_id = tostring(payload.permission)
local code = tostring(payload.code or "")
local realm_id = tostring(payload.realm)

redis.call("HSET", make_key("permission", realm_id, permission_id),
    "isRevoked", "0",
    "code", code
)

redis.call("HSET", make_key("permission-id-by-code", realm_id), code, permission_id)
redis.call("HSET", make_key("permission-code-by-id", realm_id), permission_id, code)

return "OK"
