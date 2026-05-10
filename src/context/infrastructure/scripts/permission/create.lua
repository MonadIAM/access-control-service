---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function to_redis_bool(value)
    return value and "1" or "0"
end

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local permission_id = tostring(payload.permission)
local version = tonumber(payload.version) or 1
local code = tostring(payload.code or "")
local realm_id = tostring(payload.realm)

redis.call("HSET", make_key("permission", realm_id, permission_id),
    "isRevoked", to_redis_bool(false),
    "version", version,
    "code", code
)

redis.call("HSET", make_key("permission-code-by-id", realm_id), permission_id, code)

return "OK"
