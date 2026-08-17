#!/bin/sh
set -eu

VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
export VAULT_ADDR

if [ -z "${VAULT_TOKEN:-}" ] && [ -f ../infra/.env ]; then
    VAULT_TOKEN="$(grep -E '^VAULT_ROOT_TOKEN=' ../infra/.env | head -n1 | cut -d= -f2- | tr -d '"')"
    [ -n "$VAULT_TOKEN" ] && export VAULT_TOKEN
fi

if [ -z "${VAULT_TOKEN:-}" ]; then
    echo "Set VAULT_TOKEN before running this (e.g. the value of VAULT_ROOT_TOKEN in infra/.env for local dev)," >&2
    echo "or make sure ../infra/.env exists with VAULT_ROOT_TOKEN set - it's picked up automatically." >&2
    exit 1
fi

if [ "${1:-}" = "admin" ]; then
    POSTGRES_PASSWORD="$(vault kv get -mount=kv -field=postgresql_password access-control-service/runtime)"
    echo "export POSTGRES_PASSWORD=\"$POSTGRES_PASSWORD\""
    exit 0
fi

DB_ROLE="access-control-service-app"
if [ "${1:-}" = "readonly" ]; then
    DB_ROLE="access-control-service-developer-readonly"
fi

DB_CREDS_JSON="$(vault read -format=json "database/creds/$DB_ROLE")"
POSTGRES_USER="$(printf '%s' "$DB_CREDS_JSON" | node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(0,"utf8")).data.username)')"
POSTGRES_PASSWORD="$(printf '%s' "$DB_CREDS_JSON" | node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(0,"utf8")).data.password)')"
REDIS_PASSWORD="$(vault kv get -mount=kv -field=redis_password access-control-service/runtime)"

echo "export POSTGRES_USER=\"$POSTGRES_USER\""
echo "export POSTGRES_PASSWORD=\"$POSTGRES_PASSWORD\""
echo "export REDIS_PASSWORD=\"$REDIS_PASSWORD\""
