---@diagnostic disable: undefined-global

local projection_state = (function()
    -- PROJECTION_STATE
end)()

---@type any
local projection_materializer = (function()
    -- PROJECTION_MATERIALIZER
end)()

-- PROJECTION_OPERATION
local payload = cjson.decode(ARGV[1])

local affected = projection_materializer.targets(script, payload)

local function apply()
    -- PROJECTION_SCRIPT
end

local result = apply()

projection_materializer.materialize(affected)

return result
