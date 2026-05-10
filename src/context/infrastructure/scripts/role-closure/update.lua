---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local realm_id = tostring(payload.realm)

for _, path in ipairs(payload.removedPaths or {}) do
    local ancestor_id = tostring(path.ancestor)
    local descendant_id = tostring(path.descendant)

    redis.call("UNLINK", make_key("role-closure", realm_id, ancestor_id, descendant_id))
    redis.call("ZREM", make_key("role-descendants", realm_id, ancestor_id), descendant_id)
    redis.call("ZREM", make_key("role-ancestors", realm_id, descendant_id), ancestor_id)
end

for _, path in ipairs(payload.upsertedPaths or {}) do
    local ancestor_id = tostring(path.ancestor)
    local descendant_id = tostring(path.descendant)
    local depth = tonumber(path.depth) or 0
    local version = tonumber(path.version) or 1

    redis.call("HSET", make_key("role-closure", realm_id, ancestor_id, descendant_id),
        "depth", tostring(depth),
        "version", version
    )

    redis.call("ZADD", make_key("role-descendants", realm_id, ancestor_id), depth, descendant_id)
    redis.call("ZADD", make_key("role-ancestors", realm_id, descendant_id), depth, ancestor_id)
end

return "OK"
