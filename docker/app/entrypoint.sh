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

wait_for_secret /vault/secrets/postgresql_username
wait_for_secret /vault/secrets/postgresql_password

export POSTGRES_USER="$(cat /vault/secrets/postgresql_username)"
export POSTGRES_PASSWORD="$(cat /vault/secrets/postgresql_password)"
export REDIS_PASSWORD="$(cat /vault/secrets/redis_password)"

export NODE_OPTIONS="${NODE_OPTIONS:-} --require ./dist/src/observability/tracing/tracing.js"

exec node dist/src/main.js
