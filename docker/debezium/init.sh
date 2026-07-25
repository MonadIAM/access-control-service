#!/bin/sh
set -eu

export POSTGRES_PASSWORD="$(cat /vault/secrets/postgresql_password)"

apk add --no-cache curl gettext jq

CONNECT_URL="http://${SERVICE_NAME}-kafka-connect:8083"

ENVS='${POSTGRES_PORT} ${POSTGRES_USER} ${POSTGRES_PASSWORD} ${POSTGRES_DB} ${SERVICE_NAME}'

until curl -fsS "$CONNECT_URL/connectors" >/dev/null; do
    echo "Waiting for Kafka Connect..."
    sleep 2
done

register_connector() {
    name="$1"
    template="$2"
    output="$3"

    echo "Registering ${name}..."

    envsubst "$ENVS" < "$template" > "$output"

    response="$(mktemp)"
    http_code="$(
        jq '.config' "$output" \
            | sed 's|ROUTEDBYVALUE|${routedByValue}|g' \
            | curl -sS -o "$response" -w "%{http_code}" \
                -X PUT "$CONNECT_URL/connectors/${name}/config" \
                -H 'Content-Type: application/json' \
                --data-binary @-
    )"

    cat "$response"
    echo "HTTP ${http_code}"

    if [ "$http_code" -lt 200 ] || [ "$http_code" -ge 300 ]; then
        exit 1
    fi
}

register_connector \
    "outbox-connector" \
    "/connector.outbox.json.tpl" \
    "/tmp/outbox-connector.json"

echo "Registered connectors:"
curl -sS "$CONNECT_URL/connectors"
