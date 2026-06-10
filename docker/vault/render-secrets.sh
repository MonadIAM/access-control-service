#!/bin/sh
set -eu

export VAULT_TOKEN="$(cat /vault/token/secrets)"

write_secret() {
    path="$1"
    field="$2"
    target="$3"

    vault kv get -field="$field" "$VAULT_KV_MOUNT/$path" > "$target"
    chmod 0444 "$target"
}

write_secret "$VAULT_KV_RUNTIME_PATH" postgresql_password /secrets/application/postgresql_password
write_secret "$VAULT_KV_RUNTIME_PATH" redis_password /secrets/application/redis_password

write_secret "$VAULT_KV_RUNTIME_PATH" postgresql_password /secrets/postgresql/postgresql_password
write_secret "$VAULT_KV_REPLICATION_PATH" postgresql_replication_password /secrets/postgresql/postgresql_replication_password

write_secret "$VAULT_KV_RUNTIME_PATH" redis_password /secrets/redis/redis_password
write_secret "$VAULT_KV_RUNTIME_PATH" postgresql_password /secrets/debezium/postgresql_password

rm -f /vault/token/secrets
