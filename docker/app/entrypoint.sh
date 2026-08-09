#!/bin/sh
set -eu

export POSTGRES_PASSWORD="$(cat /vault/secrets/postgresql_password)"
export REDIS_PASSWORD="$(cat /vault/secrets/redis_password)"

export NODE_OPTIONS="${NODE_OPTIONS:-} --require ./dist/src/observability/tracing/tracing.js"

exec node dist/src/main.js
