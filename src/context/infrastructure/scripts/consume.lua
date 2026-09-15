---@diagnostic disable: undefined-global

local inbox_key = KEYS[#KEYS]

if redis.call("EXISTS", inbox_key) == 1 then
    return {0}
end

local function execute()
-- PROJECTION_SCRIPT
end

local result = execute()
redis.call("SET", inbox_key, "1", "PX", ARGV[#ARGV])

return {1, result}
