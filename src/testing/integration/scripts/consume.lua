---@diagnostic disable: undefined-global

return redis.call("INCR", KEYS[1])
