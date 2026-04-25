#!/bin/sh
apk add --no-cache curl gettext jq

envsubst < /connector.json.tpl > /tmp/connector.json

jq '.config' /tmp/connector.json | sed 's|ROUTEDBYVALUE|${routedByValue}|g' | curl -s -X PUT http://${SERVICE_NAME}-kafka-connect:8083/connectors/outbox-connector/config \
  -H 'Content-Type: application/json' \
  --data-binary @-
