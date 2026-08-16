.PHONY: coverage swagger postman docs

# Infrastructure
env:
	[ -f .env.example ] && cp -f .env.example .env || echo '.env.example not found'
up:
	docker-compose up -d
stop:
	docker-compose stop
down:
	docker-compose down
build:
	docker-compose build
restart: down up
logs:
	docker-compose logs -f service
logs-all:
	docker-compose logs -f
ps:
	docker-compose ps
clean:
	docker-compose down -v
prune:
	docker system prune -f

# Development
lint:
	npm run lint
knip:
	npm run knip
swagger:
	npm run swagger
postman:
	npm run postman
docs: swagger postman

# Database
db-creds-readonly:
	sh docker/vault/fetch-creds.sh readonly
migrate:
	CREDS="$$(sh docker/vault/fetch-creds.sh admin)" || exit 1; \
	eval "$$CREDS"; \
	npx mikro-orm migration:up
migration:
	npx mikro-orm migration:create --name=$(name)
seed: seed-pg seed-redis
seed-pg:
	CREDS="$$(sh docker/vault/fetch-creds.sh)" || exit 1; \
	eval "$$CREDS"; \
	npx mikro-orm seeder:run
seed-redis:
	CREDS="$$(sh docker/vault/fetch-creds.sh)" || exit 1; \
	eval "$$CREDS"; \
	npx ts-node --transpile-only -r tsconfig-paths/register ./src/infrastructure/redis/seeder.ts

# Test
test:
	NODE_OPTIONS=--experimental-vm-modules npx jest --config ./jest.unit.config.ts
coverage:
	NODE_OPTIONS=--experimental-vm-modules npx jest --config ./jest.unit.config.ts --coverage
