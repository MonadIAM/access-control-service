#!/bin/bash
set -e

PGDATA="/var/lib/postgresql/data"

echo "Starting replica initialization..."

# Проверяем, инициализирована ли уже реплика
if [ -s "$PGDATA/PG_VERSION" ]; then
    echo "Replica already initialized, starting PostgreSQL..."
    exec gosu postgres postgres -c hot_standby=on
fi

echo "Waiting for primary server to be ready..."
until PGPASSWORD="$POSTGRESQL_REPLICATION_PASSWORD" pg_isready -h "$POSTGRESQL_WRITE_HOST" -p "$POSTGRESQL_WRITE_PORT" -U "$POSTGRESQL_REPLICATION_USER"; do
    echo "Primary server is not ready yet, waiting..."
    sleep 2
done

echo "Primary server is ready, creating base backup..."

# Очищаем директорию данных
rm -rf "$PGDATA"/*

# Создаём базовый бэкап с primary сервера
PGPASSWORD="$POSTGRESQL_REPLICATION_PASSWORD" pg_basebackup \
    -h "$POSTGRESQL_WRITE_HOST" \
    -p "$POSTGRESQL_WRITE_PORT" \
    -U "$POSTGRESQL_REPLICATION_USER" \
    -D "$PGDATA" \
    -Fp \
    -Xs \
    -P \
    -R \
    -S "$POSTGRESQL_REPLICATION_SLOT"

# Настраиваем владельца и права доступа
chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

# Создаём standby.signal для режима hot standby
touch "$PGDATA/standby.signal"
chown postgres:postgres "$PGDATA/standby.signal"

echo "Replica initialization completed successfully"
echo "Starting PostgreSQL in hot standby mode..."

exec gosu postgres postgres -c hot_standby=on
