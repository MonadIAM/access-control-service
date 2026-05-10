#!/bin/sh
set -eu

apk add --no-cache curl gettext jq

echo "Registering outbox connector..."
envsubst < /connector.outbox.json.tpl > /tmp/outbox-connector.json

jq '.config' /tmp/outbox-connector.json \
  | sed 's|ROUTEDBYVALUE|${routedByValue}|g' \
  | curl -s -f -X PUT "http://${SERVICE_NAME}-kafka-connect:8083/connectors/outbox-connector/config" \
      -H 'Content-Type: application/json' \
      --data-binary @-

echo "Registering projection journal connector..."
envsubst < /connector.projection-journal.json.tpl > /tmp/projection-journal-connector.json

jq '.config' /tmp/projection-journal-connector.json \
  | curl -s -f -X PUT "http://${SERVICE_NAME}-kafka-connect:8083/connectors/projection-journal-connector/config" \
      -H 'Content-Type: application/json' \
      --data-binary @-

echo "Registered connectors:"
curl -s "http://${SERVICE_NAME}-kafka-connect:8083/connectors"
