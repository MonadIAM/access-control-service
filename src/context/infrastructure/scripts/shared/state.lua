---@diagnostic disable: undefined-global

local projection_time = redis.call("TIME")
local projection_now = tonumber(projection_time[1]) * 1000 + math.floor(tonumber(projection_time[2]) / 1000)
-- PROJECTION_SYSTEM_REALM

local function projection_key(...)
    return table.concat({"projection", ...}, ":")
end

local function projection_pair(value)
    local separator = string.find(value, ":", 1, true)

    if separator == nil or separator == 1 or separator == #value then
        return nil, nil
    end

    if string.find(value, ":", separator + 1, true) then
        return nil, nil
    end

    return string.sub(value, 1, separator - 1), string.sub(value, separator + 1)
end

local function projection_available(value)

    if not value then
        return false
    end

    local available_from, expires_at = projection_pair(value)
    available_from = tonumber(available_from)
    expires_at = tonumber(expires_at)

    return available_from ~= nil and expires_at ~= nil
        and available_from <= projection_now
        and (expires_at == 0 or expires_at > projection_now)
end

local function projection_expiry(value)

    if value == nil or value == false or value == cjson.null or value == "" or value == 0 or value == "0" then
        return math.huge
    end

    if value == "inf" or value == "+inf" then
        return math.huge
    end

    local expiry = tonumber(value)

    if expiry == nil or expiry < 0 then
        error("Invalid projection expiration")
    end

    return expiry
end

local function projection_active(key)
    return redis.call("HGET", key, "isRevoked") == "0"
end

local function projection_deadline(key)
    local state = redis.call("HMGET", key, "isRevoked", "expiresAt")

    if state[1] ~= "0" then
        return 0
    end

    return projection_expiry(state[2])
end

local function projection_score(key, member)
    local value = redis.call("ZSCORE", key, member)

    return value and projection_expiry(value) or 0
end

local function projection_stored_expiry(value)
    local deadline = projection_expiry(value)

    return deadline == math.huge and "0" or tostring(deadline)
end

return {
    now = projection_now,
    system_realm = projection_system_realm,
    key = projection_key,
    pair = projection_pair,
    available = projection_available,
    expiry = projection_expiry,
    active = projection_active,
    deadline = projection_deadline,
    score = projection_score,
    stored_expiry = projection_stored_expiry,
}
