#!/bin/bash
set -e

export POSTGRES_REPLICATION_PASSWORD="$(cat /vault/secrets/postgresql_replication_password)"
export POSTGRES_PASSWORD="$(cat /vault/secrets/postgresql_password)"

PGDATA="/var/lib/postgresql/data"

echo "Starting replica initialization..."

if [ -s "$PGDATA/PG_VERSION" ]; then
    echo "Replica already initialized, starting PostgreSQL..."
    exec gosu postgres postgres -c hot_standby=on
fi

echo "Waiting for primary server to be ready..."
until PGPASSWORD="$POSTGRES_REPLICATION_PASSWORD" pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_REPLICATION_USER"; do
    echo "Primary server is not ready yet, waiting..."
    sleep 2
done

echo "Primary server is ready, creating base backup..."

rm -rf "$PGDATA"/*

PGPASSWORD="$POSTGRES_REPLICATION_PASSWORD" pg_basebackup \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_REPLICATION_USER" \
    -D "$PGDATA" \
    -Fp \
    -Xs \
    -P \
    -R \
    -S "$POSTGRES_REPLICATION_SLOT"

chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

touch "$PGDATA/standby.signal"
chown postgres:postgres "$PGDATA/standby.signal"

echo "Replica initialization completed successfully"
echo "Starting PostgreSQL in hot standby mode..."

exec gosu postgres postgres -c hot_standby=on
