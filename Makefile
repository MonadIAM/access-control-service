.PHONY: env build up down restart lint lint-fix tsc knip secrets-check env-check intl-types intl-check lsp migrate migration empty-migration seed seed-postgresql seed-redis test utest itest coverage coverage-unit coverage-integration coverage-all graphify graphify-rebuild graphify-html image image-publish image-release image-cleanup

SERVICE_EXEC_WITH_SECRETS ?= docker-compose exec service sh /usr/local/bin/with-vault-secrets.sh
GRAPHIFY ?= graphify
IMAGE ?= monadiam/access-control-service:local
BASE_IMAGE ?= node:24.18.0-alpine3.24
VCS_REF ?= $(shell git rev-parse HEAD)

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
	$(MAKE) seed-postgresql
	$(MAKE) seed-redis
seed-postgresql:
	$(SERVICE_EXEC_WITH_SECRETS) pnpm run db:seed:postgresql
seed-redis:
	$(SERVICE_EXEC_WITH_SECRETS) pnpm run db:seed:redis

# Container / GHCR
image:
	docker build --file docker/app/Dockerfile --target runner --build-arg BASE_IMAGE="$(BASE_IMAGE)" --build-arg VCS_REF="$(VCS_REF)" --tag "$(IMAGE)" .
image-publish:
	bash .github/scripts/packages.sh sha
image-release:
	bash .github/scripts/packages.sh release
image-cleanup:
	bash .github/scripts/packages.sh cleanup

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
