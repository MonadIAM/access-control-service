---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local payload = cjson.decode(ARGV[1])
local account = tostring(payload.account)
local realm = tostring(payload.realm)
local owner = tostring(payload.permissionRealm)
local system = tostring(payload.systemRealm)
local permissions = payload.permissions or (payload.permission and {payload.permission} or {})
local result = {}

for first = 1, #permissions, 64 do
    local codes = {}

    for index = first, math.min(first + 63, #permissions) do
        table.insert(codes, tostring(permissions[index]))
    end

    local local_values = {}
    local missing = {}

    if not payload.globalOnly then
        local_values = redis.call("HMGET", state.key("effective", "REALM", realm, account, owner), unpack(codes))
    end

    for index, code in ipairs(codes) do
        if state.available(local_values[index]) then
            result[code] = "REALM"
        else
            table.insert(missing, code)
        end
    end

    if #missing > 0 and system == state.system_realm then
        local global_values = redis.call("HMGET", state.key("effective", "GLOBAL", system, account, owner), unpack(missing))

        for index, code in ipairs(missing) do
            if state.available(global_values[index]) then
                result[code] = "GLOBAL"
            end
        end
    end
end

return cjson.encode(result)
