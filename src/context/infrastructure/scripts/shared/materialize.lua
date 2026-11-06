---@diagnostic disable: undefined-global

local state = require("context.infrastructure.scripts.shared.state")

local function collect_targets(script, payload)
    local targets = {}
    local visited_roles = {}
    local expanded_roles = {}

    local function add_target(realm, account)

        if realm and account then
            realm = tostring(realm)
            account = tostring(account)

            targets[realm] = targets[realm] or {}
            targets[realm][account] = true
        end
    end

    local function add_role(realm, role)
        local key = state.key("account-role-assignments", "by-role", realm, role)

        if visited_roles[key] then
            return
        end

        visited_roles[key] = true

        for _, account in ipairs(redis.call("SMEMBERS", key)) do
            add_target(realm, account)
        end
    end

    local function add_subtree(realm, role)
        local key = state.key("role-descendants", realm, role)

        if expanded_roles[key] then
            return
        end

        expanded_roles[key] = true
        add_role(realm, role)

        for _, descendant in ipairs(redis.call("ZRANGE", key, 0, -1)) do
            add_role(realm, descendant)
        end
    end

    local function add_permission(realm, permission, excluded_realm)
        local role_usages = redis.call("SMEMBERS", state.key("permission-usages", "role-assignments", realm, permission))
        local override_usages = redis.call("SMEMBERS", state.key("permission-usages", "overrides", realm, permission))

        for _, usage in ipairs(role_usages) do
            local target_realm, role = state.pair(usage)

            if target_realm and target_realm ~= excluded_realm then
                add_subtree(target_realm, role)
            end
        end

        for _, usage in ipairs(override_usages) do
            local target_realm, account = state.pair(usage)
            if target_realm ~= excluded_realm then
                add_target(target_realm, account)
            end
        end
    end

    local realm = payload.realm and tostring(payload.realm)
    local separator = string.find(script, "/", 1, true)
    local entity = separator and string.sub(script, 1, separator - 1) or script

    if entity == "seed" then
        for _, item in ipairs(payload.accountRoleAssignments or {}) do
            add_target(item.realm_id, item.account)
        end

        for _, item in ipairs(payload.permissionOverrides or {}) do
            add_target(item.realm_id, item.account)
        end
    elseif entity == "account-role-assignment" or entity == "permission-override" then
        add_target(realm, payload.account)

        for _, item in ipairs(payload.items or {}) do
            add_target(item.realm or realm, item.account)
        end
    elseif entity == "role-permission-assignment" then
        if payload.role then
            add_subtree(realm, tostring(payload.role))
        end

        for _, item in ipairs(payload.items or {}) do
            add_subtree(tostring(item.realm or realm), tostring(item.role))
        end
    elseif entity == "permission" then
        if payload.permission then
            add_permission(realm, tostring(payload.permission))
        end

        for _, permission in ipairs(payload.permissions or {}) do
            add_permission(realm, tostring(permission))
        end
    elseif entity == "role" or entity == "role-closure" then
        if payload.role then
            add_role(realm, tostring(payload.role))
        end

        for _, role in ipairs(payload.roles or {}) do
            add_subtree(realm, tostring(role))
        end

        for _, step in ipairs(payload.steps or {}) do
            for _, path in ipairs(step.removedPaths or {}) do
                add_role(realm, tostring(path.descendant.id))
            end

            for _, path in ipairs(step.upsertedPaths or {}) do
                add_role(realm, tostring(path.descendant.id))
            end
        end

        for _, path in ipairs(payload.paths or {}) do
            add_role(realm, tostring(path.descendant.id))
        end
    elseif entity == "realm" then
        for _, account in ipairs(redis.call("SMEMBERS", state.key("effective-accounts", realm))) do
            add_target(realm, account)
        end

        for _, item in ipairs(payload.accountRoleAssignments or {}) do
            add_target(realm, item.account)
        end

        for _, permission in ipairs(redis.call("HVALS", state.key("permission-id-by-code", realm))) do
            add_permission(realm, permission, realm)
        end
    end

    return targets
end

local function write_permissions(key, granted, denied)
    redis.call("UNLINK", key)

    local arguments = {}

    for code, deadline in pairs(granted) do
        local blocked_until = denied[code] or 0
        local available_from = blocked_until > state.now and blocked_until or 0

        if deadline > state.now and available_from < deadline then
            table.insert(arguments, code)
            table.insert(arguments, tostring(available_from) .. ":" .. state.stored_expiry(deadline))

            if #arguments == 128 then
                redis.call("HSET", key, unpack(arguments))
                arguments = {}
            end
        end
    end

    if #arguments > 0 then
        redis.call("HSET", key, unpack(arguments))
    end
end

local function materialize(targets)
    local active_cache = {}
    local permission_cache = {}
    local grant_cache = {}
    local ancestor_cache = {}

    local function active(key)

        if active_cache[key] == nil then
            active_cache[key] = state.active(key)
        end

        return active_cache[key]
    end

    local function permission_codes(owner, sources)
        local cache = permission_cache[owner]

        if cache == nil then
            cache = {}
            permission_cache[owner] = cache
        end

        local pending = {}
        local seen = {}

        for _, permissions in pairs(sources) do
            for permission in pairs(permissions) do
                if cache[permission] == nil and not seen[permission] then
                    table.insert(pending, permission)
                    seen[permission] = true
                end
            end
        end

        if #pending == 0 then
            return cache
        end

        if not active(state.key("realm", owner)) then
            for _, permission in ipairs(pending) do
                cache[permission] = false
            end

            return cache
        end

        for first = 1, #pending, 64 do
            local arguments = {}
            local last = math.min(first + 63, #pending)

            for index = first, last do
                local permission = pending[index]
                table.insert(arguments, permission .. ":isRevoked")
                table.insert(arguments, permission .. ":code")
            end

            local fields = redis.call("HMGET", state.key("permissions", owner), unpack(arguments))

            for index = first, last do
                local offset = (index - first) * 2
                cache[pending[index]] = fields[offset + 1] == "0" and fields[offset + 2] or false
            end
        end

        return cache
    end

    local function direct_grants(realm, role)
        local key = state.key("role", realm, role)

        if grant_cache[key] then
            return grant_cache[key]
        end

        local grants = {}
        grant_cache[key] = grants

        if not active(key) then
            return grants
        end

        local fields = redis.call("HGETALL", state.key("role-permission-assignments", realm, role))
        local assignments = {}

        for index = 1, #fields, 2 do
            local permission, attribute = state.pair(fields[index])

            if permission then
                assignments[permission] = assignments[permission] or {}
                assignments[permission][attribute] = fields[index + 1]
            end
        end

        for permission, assignment in pairs(assignments) do
            local owner = assignment.permissionRealm
            local scope = assignment.scope

            if assignment.isRevoked == "0"
                and (owner == realm or owner == state.system_realm)
                and (scope == "REALM" or (scope == "GLOBAL" and realm == state.system_realm)) then
                table.insert(grants, { owner = owner, permission = permission, scope = scope })
            end
        end

        return grants
    end

    for realm, accounts in pairs(targets) do
        local realm_active = active(state.key("realm", realm))
        local owners = { realm }

        if realm ~= state.system_realm then
            table.insert(owners, state.system_realm)
        end

        for account in pairs(accounts) do
            local sources = {}
            local access_until = 0
            local roles = redis.call("SMEMBERS", state.key("account-role-assignments", "by-account", realm, account))
            local overrides = redis.call("SMEMBERS", state.key("permission-overrides", "by-account", realm, account))

            for _, owner in ipairs(owners) do
                sources[owner] = { REALM = {}, GLOBAL = {}, DENY = {} }
            end

            if realm_active then
                local inherited_until = {}

                for _, role in ipairs(roles) do
                    local deadline = state.deadline(state.key("account-role-assignment", realm, account, role))

                    if deadline > state.now and active(state.key("role", realm, role)) then
                        access_until = math.max(access_until, deadline)

                        local key = state.key("role-ancestors", realm, role)

                        if ancestor_cache[key] == nil then
                            ancestor_cache[key] = redis.call("ZRANGE", key, 0, -1)
                        end

                        for _, ancestor in ipairs(ancestor_cache[key]) do
                            inherited_until[ancestor] = math.max(inherited_until[ancestor] or 0, deadline)
                        end
                    end
                end

                for ancestor, deadline in pairs(inherited_until) do
                    for _, grant in ipairs(direct_grants(realm, ancestor)) do
                        local permissions = sources[grant.owner][grant.scope]
                        permissions[grant.permission] = math.max(permissions[grant.permission] or 0, deadline)
                    end
                end

                for _, permission in ipairs(overrides) do
                    local fields = redis.call(
                        "HMGET",
                        state.key("permission-override", realm, account, permission),
                        "isRevoked", "expiresAt", "permissionRealm", "effect"
                    )
                    local owner = fields[3]
                    local effect = fields[4]

                    if fields[1] == "0"
                        and (owner == realm or owner == state.system_realm)
                        and (effect == "ALLOW" or effect == "DENY") then
                        local deadline = state.expiry(fields[2])

                        if deadline > state.now then
                            local permissions = sources[owner][effect == "ALLOW" and "REALM" or "DENY"]
                            permissions[permission] = math.max(permissions[permission] or 0, deadline)
                        end
                    end
                end
            end

            for _, owner in ipairs(owners) do
                local codes = permission_codes(owner, sources[owner])
                local permissions = { REALM = {}, GLOBAL = {}, DENY = {} }

                for scope, members in pairs(sources[owner]) do
                    for permission, deadline in pairs(members) do
                        local code = codes[permission]

                        if code then
                            permissions[scope][code] = math.max(permissions[scope][code] or 0, deadline)
                        end
                    end
                end

                write_permissions(state.key("effective", "REALM", realm, account, owner), permissions.REALM, permissions.DENY)

                if realm == state.system_realm then
                    write_permissions(state.key("effective", "GLOBAL", realm, account, owner), permissions.GLOBAL, permissions.DENY)
                end
            end

            if access_until > state.now then
                local deadline = access_until == math.huge and "+inf" or access_until
                redis.call("ZADD", state.key("effective-realms", account), deadline, realm)
            else
                redis.call("ZREM", state.key("effective-realms", account), realm)
            end

            if #roles > 0 or #overrides > 0 then
                redis.call("SADD", state.key("effective-accounts", realm), account)
            else
                redis.call("SREM", state.key("effective-accounts", realm), account)
            end
        end
    end
end

return {
    targets = collect_targets,
    materialize = materialize,
}
