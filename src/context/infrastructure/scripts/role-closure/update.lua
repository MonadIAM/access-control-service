---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local realm_id = tostring(payload.realm)

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
