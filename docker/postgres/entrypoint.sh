#!/bin/sh
set -eu

export POSTGRES_REPLICATION_PASSWORD="$(cat /vault/secrets/postgresql_replication_password)"
export POSTGRES_PASSWORD="$(cat /vault/secrets/postgresql_password)"

exec docker-entrypoint.sh "$@"
