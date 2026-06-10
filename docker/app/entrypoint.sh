#!/bin/sh
set -eu

export POSTGRES_PASSWORD="$(cat /vault/secrets/postgresql_password)"
export REDIS_PASSWORD="$(cat /vault/secrets/redis_password)"

exec node dist/src/main.js
