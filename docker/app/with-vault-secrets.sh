#!/bin/sh
set -eu

export POSTGRES_USER
export POSTGRES_PASSWORD
export REDIS_PASSWORD

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
wait_for_secret /vault/secrets/redis_password

POSTGRES_USER="$(cat /vault/secrets/postgresql_username)"
POSTGRES_PASSWORD="$(cat /vault/secrets/postgresql_password)"
REDIS_PASSWORD="$(cat /vault/secrets/redis_password)"

exec "$@"
