---@diagnostic disable: undefined-global, deprecated

local cursor = "0"
local batch_size = 1000

repeat
    local result = redis.call("SCAN", cursor, "MATCH", "projection:*", "COUNT", batch_size)
    cursor = result[1]
    local keys = result[2]

    if #keys > 0 then
        redis.call("UNLINK", unpack(keys))
    end
until cursor == "0"

return "OK"
