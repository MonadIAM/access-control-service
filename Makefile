.PHONY: env build up down restart lint lint-fix tsc knip secrets-check env-check intl-types intl-check lsp migrate migration empty-migration seed test utest itest coverage coverage-unit coverage-integration coverage-all graphify graphify-rebuild graphify-html

SERVICE_EXEC_WITH_SECRETS := docker-compose exec service sh /usr/local/bin/with-vault-secrets.sh
GRAPHIFY ?= graphify

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
lint-fix:
	@pnpm --silent run lint:fix
tsc:
	pnpm run tsc
knip:
	pnpm run knip
secrets-check:
	pnpm run secrets:check
env-check:
	pnpm run env:check
intl-types:
	pnpm run intl:types
intl-check:
	pnpm run intl:check
lsp:
	@pnpm --silent run lsp

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
	pnpm run test
utest:
	pnpm run utest
itest:
	pnpm run itest
coverage:
	pnpm run coverage:all
coverage-unit:
	pnpm run coverage:unit
coverage-integration:
	pnpm run coverage:integration

# Local code graph
graphify:
	$(GRAPHIFY) extract . --code-only
	$(GRAPHIFY) cluster-only . --no-viz --no-label

graphify-rebuild:
	$(GRAPHIFY) extract . --code-only --force
	$(GRAPHIFY) cluster-only . --no-viz --no-label

graphify-html: graphify
	$(GRAPHIFY) export html
