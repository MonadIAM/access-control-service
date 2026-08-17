#!/bin/bash
set -eu

psql "$1" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${POSTGRES_DB}\";"

psql "$1" -v ON_ERROR_STOP=1 <<-EOSQL
	\c "${POSTGRES_DB}"
	\i /docker-entrypoint-initdb.d/10-readonly-role.sql
EOSQL
