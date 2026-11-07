---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local payload = cjson.decode(ARGV[1])
local account = tostring(payload.account)
local owner = tostring(payload.permissionRealm)
local system = tostring(payload.systemRealm)
local result = { realms = {}, global = {} }

local function collect(realm, scope)
    local values = redis.call("HGETALL", state.key("effective", scope, realm, account, owner))
    local permissions = {}

    for index = 1, #values, 2 do
        if state.available(values[index + 1]) then
            permissions[values[index]] = scope
        end
    end

    return permissions
end

if system == state.system_realm then
    result.global = collect(system, "GLOBAL")
end

for _, realm in ipairs(payload.realms or {}) do
    realm = tostring(realm)
    result.realms[realm] = collect(realm, "REALM")
end

return cjson.encode(result)
