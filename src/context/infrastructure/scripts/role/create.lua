---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm_id = tostring(payload.realm)
local role_id = tostring(payload.role)

redis.call("HSET", state.key("role", realm_id, role_id), "isRevoked", "0")
redis.call("SADD", state.key("realm-roles", realm_id), role_id)

for _, step in ipairs(payload.steps or {}) do
    for _, path in ipairs(step.removedPaths or {}) do
        local ancestor_id = tostring(path.ancestor.id)
        local descendant_id = tostring(path.descendant.id)

        if ancestor_id ~= descendant_id then
            redis.call("ZREM", state.key("role-descendants", realm_id, ancestor_id), descendant_id)
            redis.call("ZREM", state.key("role-ancestors", realm_id, descendant_id), ancestor_id)
        end
    end

    for _, path in ipairs(step.upsertedPaths or {}) do
        local descendant_id = tostring(path.descendant.id)
        local ancestor_id = tostring(path.ancestor.id)
        local depth = tonumber(path.depth)

        redis.call("ZADD", state.key("role-descendants", realm_id, ancestor_id), depth, descendant_id)
        redis.call("ZADD", state.key("role-ancestors", realm_id, descendant_id), depth, ancestor_id)
    end
end

return "OK"
