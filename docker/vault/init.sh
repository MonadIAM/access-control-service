#!/bin/sh
set -eu

vault secrets list -format=json | grep -q "\"$VAULT_KV_MOUNT/\"" ||
    vault secrets enable -path="$VAULT_KV_MOUNT" -version=2 kv

vault kv get "$VAULT_KV_MOUNT/$VAULT_KV_RUNTIME_PATH" >/dev/null 2>&1 ||
    vault kv put "$VAULT_KV_MOUNT/$VAULT_KV_RUNTIME_PATH" \
        postgresql_password="$POSTGRES_PASSWORD" \
        redis_password="$REDIS_PASSWORD"

vault kv get "$VAULT_KV_MOUNT/$VAULT_KV_REPLICATION_PATH" >/dev/null 2>&1 ||
    vault kv put "$VAULT_KV_MOUNT/$VAULT_KV_REPLICATION_PATH" \
        postgresql_replication_password="$POSTGRES_REPLICATION_PASSWORD"

sed \
    -e "s|{{kv_mount}}|$VAULT_KV_MOUNT|g" \
    -e "s|{{runtime_path}}|$VAULT_KV_RUNTIME_PATH|g" \
    -e "s|{{replication_path}}|$VAULT_KV_REPLICATION_PATH|g" \
    /secrets-policy.hcl > /tmp/secrets-policy.hcl

vault policy write access-control-service-secrets /tmp/secrets-policy.hcl
vault token create \
    -field=token \
    -policy=access-control-service-secrets \
    -no-default-policy \
    -ttl=15m \
    -explicit-max-ttl=15m \
    > /vault/token/secrets
chmod 0400 /vault/token/secrets
