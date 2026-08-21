#!/bin/sh
set -eu

wait_for_secret() {
    path="$1"
    i=0
    until [ -s "$path" ]; do
        i=$((i + 1))
        if [ "$i" -ge 60 ]; then
            echo "Timed out waiting for $path" >&2
            exit 1
        fi
        sleep 1
    done
}

wait_for_tcp() {
    host="$1"
    port="$2"
    name="$3"
    i=0
    until nc -z "$host" "$port" >/dev/null 2>&1; do
        i=$((i + 1))
        if [ "$i" -ge 60 ]; then
            echo "Timed out waiting for $name at $host:$port" >&2
            exit 1
        fi
        sleep 1
    done
}

wait_for_secret /vault/secrets/postgresql_username
wait_for_secret /vault/secrets/postgresql_password
wait_for_secret /tls/client.crt
wait_for_secret /tls/client.key
wait_for_secret /tls/ca.crt

export POSTGRES_USER="$(cat /vault/secrets/postgresql_username)"
export POSTGRES_PASSWORD="$(cat /vault/secrets/postgresql_password)"
export REDIS_PASSWORD="$(cat /vault/secrets/redis_password)"

wait_for_tcp "$POSTGRES_WRITE_HOST" "$POSTGRES_WRITE_PORT" "PostgreSQL write upstream"
wait_for_tcp "$POSTGRES_READ_HOST" "$POSTGRES_READ_PORT" "PostgreSQL read upstream"
wait_for_tcp "$REDIS_HOST" "$REDIS_PORT" "Redis upstream"

TRACING_REQUIRE="--require ./dist/src/observability/tracing/tracing.js"
if [ -n "${NODE_OPTIONS+x}" ] && [ -n "$NODE_OPTIONS" ]; then
    export NODE_OPTIONS="$NODE_OPTIONS $TRACING_REQUIRE"
else
    export NODE_OPTIONS="$TRACING_REQUIRE"
fi
unset TRACING_REQUIRE

exec node dist/src/main.js
