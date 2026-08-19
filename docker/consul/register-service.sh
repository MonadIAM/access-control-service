#!/bin/sh
set -eu

CONSUL_HTTP_ADDR="${CONSUL_HTTP_ADDR:-http://consul:8500}"
SERVICE_DEFINITION="${SERVICE_DEFINITION:-/consul/service.hcl}"

export CONSUL_HTTP_ADDR

i=0
until consul info >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -ge 60 ]; then
        echo "Timed out waiting for Consul" >&2
        exit 1
    fi
    sleep 1
done

consul services register "$SERVICE_DEFINITION"
