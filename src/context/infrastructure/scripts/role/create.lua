---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local parent_id = tostring(payload.parent)
local realm_id = tostring(payload.realm)
local role_id = tostring(payload.role)

local role_key = make_key("role", realm_id, role_id)
local role_ancestors_key = make_key("role-ancestors", realm_id, role_id)
local role_descendants_key = make_key("role-descendants", realm_id, role_id)
local parent_ancestors_key = make_key("role-ancestors", realm_id, parent_id)

redis.call("HSET", role_key, "isRevoked", "0")
redis.call("SADD", make_key("realm-roles", realm_id), role_id)

redis.call("HSET", make_key("role-closure", realm_id, role_id, role_id),
    "depth", "0"
)

redis.call("ZADD", role_ancestors_key, 0, role_id)
redis.call("ZADD", role_descendants_key, 0, role_id)

local parent_ancestors = redis.call("ZRANGE", parent_ancestors_key, 0, -1, "WITHSCORES")

for index = 1, #parent_ancestors, 2 do
    local ancestor_id = tostring(parent_ancestors[index])
    local parent_depth = tonumber(parent_ancestors[index + 1]) or 0
    local depth = parent_depth + 1

    redis.call("HSET", make_key("role-closure", realm_id, ancestor_id, role_id),
        "depth", tostring(depth)
    )

    redis.call("ZADD", role_ancestors_key, depth, ancestor_id)
    redis.call("ZADD", make_key("role-descendants", realm_id, ancestor_id), depth, role_id)
end

return "OK"
