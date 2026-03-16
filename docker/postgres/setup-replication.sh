#!/bin/bash
set -e

echo "Configuring PostgreSQL primary for replication..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_REPLICATION_USER}') THEN
            CREATE ROLE ${POSTGRES_REPLICATION_USER} WITH REPLICATION LOGIN PASSWORD '${POSTGRES_REPLICATION_PASSWORD}';
        END IF;
    END \$\$;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT pg_create_physical_replication_slot('${POSTGRES_REPLICATION_SLOT}')
    WHERE NOT EXISTS (
        SELECT FROM pg_replication_slots WHERE slot_name = '${POSTGRES_REPLICATION_SLOT}'
    );
EOSQL

if ! grep -q "host.*replication.*${POSTGRES_REPLICATION_USER}" "$PGDATA/pg_hba.conf"; then
    echo "host    replication     ${POSTGRES_REPLICATION_USER}     all                 md5" >> "$PGDATA/pg_hba.conf"
    echo "Replication rule added to pg_hba.conf"
fi

echo "Primary server configuration completed"
