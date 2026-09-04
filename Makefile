.PHONY: env up down build restart lint knip intl-types intl-check migrate migration empty-migration seed test coverage

SERVICE_EXEC_WITH_SECRETS := docker-compose exec service sh /usr/local/bin/with-vault-secrets.sh

# Infrastructure
env:
	[ -f .env.local.example ] && cp -f .env.local.example .env || echo '.env.local.example not found'
build:
	docker-compose build service
up:
	docker-compose up -d
down:
	docker-compose down
restart: down up

# Development
lint:
	pnpm run lint
knip:
	pnpm run knip
intl-types:
	pnpm run intl:types
intl-check:
	pnpm run intl:check

# Database
migrate:
	$(SERVICE_EXEC_WITH_SECRETS) pnpm run db:migrate
migration:
	$(SERVICE_EXEC_WITH_SECRETS) pnpm exec mikro-orm migration:create --name=$(name)
empty-migration:
	$(SERVICE_EXEC_WITH_SECRETS) pnpm exec mikro-orm migration:create --blank --name=$(name)
seed:
	$(SERVICE_EXEC_WITH_SECRETS) pnpm run db:seed

# Test
test:
	NODE_OPTIONS=--experimental-vm-modules npx jest --config ./jest.unit.config.mjs
coverage:
	NODE_OPTIONS=--experimental-vm-modules npx jest --config ./jest.unit.config.mjs --coverage
