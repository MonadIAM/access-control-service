---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

local function make_key(...)
    return table.concat({"projection", ...}, ":")
end

local items   = payload.items or {}
local groups  = {}
local missing = {}

for _, item in ipairs(items) do
    local account_id = tostring(item.account)
    local realm_id   = tostring(item.realm)
    local role_id    = tostring(item.role)
    local group_key  = realm_id .. ":" .. account_id

    if not groups[group_key] then
        groups[group_key] = { realm = realm_id, account = account_id, found = 0 }
    end

    local exists = redis.call("HEXISTS", make_key("account-role-assignment", realm_id, account_id, role_id), "assignmentId")

    if exists == 1 then
        groups[group_key].found = groups[group_key].found + 1
    else
        table.insert(missing, role_id)
    end
end

local result_groups = {}

for _, group in pairs(groups) do
    local total     = redis.call("SCARD", make_key("account-role-assignments", "by-account", group.realm, group.account))
    local remaining = total - group.found

    table.insert(result_groups, { account = group.account, realm = group.realm, remaining = remaining })
end

return cjson.encode({ missing = missing, groups = result_groups })
