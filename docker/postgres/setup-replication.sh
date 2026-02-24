#!/bin/bash
set -e

echo "Configuring PostgreSQL primary for replication..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRESQL_REPLICATION_USER}') THEN
            CREATE ROLE ${POSTGRESQL_REPLICATION_USER} WITH REPLICATION LOGIN PASSWORD '${POSTGRESQL_REPLICATION_PASSWORD}';
        END IF;
    END \$\$;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT pg_create_physical_replication_slot('${POSTGRESQL_REPLICATION_SLOT}')
    WHERE NOT EXISTS (
        SELECT FROM pg_replication_slots WHERE slot_name = '${POSTGRESQL_REPLICATION_SLOT}'
    );
EOSQL

if ! grep -q "host.*replication.*${POSTGRESQL_REPLICATION_USER}" "$PGDATA/pg_hba.conf"; then
    echo "host    replication     ${POSTGRESQL_REPLICATION_USER}     all                 md5" >> "$PGDATA/pg_hba.conf"
    echo "Replication rule added to pg_hba.conf"
fi

echo "Primary server configuration completed"
