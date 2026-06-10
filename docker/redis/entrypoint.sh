#!/bin/sh
set -eu

exec docker-entrypoint.sh redis-server --requirepass "$(cat /vault/secrets/redis_password)"
