---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])
local source = cjson.decode(ARGV[2])
local key = "projection:revision:" .. payload.realm
local partition = tostring(source.partition)
local offset = tostring(source.offset)
local previous = redis.call("HGET", key, partition)

if not previous or #offset > #previous or (#offset == #previous and offset > previous) then
    redis.call("HSET", key, partition, offset)
end

return offset
