#!/bin/bash
set -eu

: "${PATRONI_NAME:?PATRONI_NAME must be set per node (see docker-compose.yml)}"
: "${PATRONI_NODE_HOST:?PATRONI_NODE_HOST must be set per node (see docker-compose.yml) - must be the container_name, not the bare compose service name, since postgresql-1/postgresql-2 collide across services on the shared consul_net}"

export PATRONI_SUPERUSER_USERNAME="${POSTGRES_USER}"
export PATRONI_SUPERUSER_PASSWORD="$(cat /vault/secrets/postgresql_password)"
export PATRONI_REPLICATION_USERNAME="${POSTGRES_REPLICATION_USER}"
export PATRONI_REPLICATION_PASSWORD="$(cat /vault/secrets/postgresql_replication_password)"

export PATRONI_POSTGRESQL_CONNECT_ADDRESS="${PATRONI_NODE_HOST}:5432"
export PATRONI_RESTAPI_CONNECT_ADDRESS="${PATRONI_NODE_HOST}:8008"

PGDATA_ROOT="/var/lib/postgresql/data"
mkdir -p "$PGDATA_ROOT"
chown -R postgres:postgres "$PGDATA_ROOT"
chmod 700 "$PGDATA_ROOT"

exec gosu postgres patroni /patroni.yml
