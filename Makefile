.PHONY: env up stop down build build-app build-ops restart logs logs-all ps clean prune lint knip swagger postman docs db-creds-readonly migrate migration seed seed-pg seed-redis test coverage

OPS_RUN = docker-compose --profile ops run --rm ops

# Infrastructure
env:
	[ -f .env.example ] && cp -f .env.example .env || echo '.env.example not found'
up: build
	docker-compose up -d
stop:
	docker-compose stop
down:
	docker-compose down
build: build-app build-ops
build-app:
	docker-compose build service
build-ops:
	docker-compose --profile ops build ops
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
	$(OPS_RUN) npx mikro-orm migration:up
migration:
	$(OPS_RUN) npx mikro-orm migration:create --name=$(name)
seed:
	$(MAKE) seed-pg
	$(MAKE) seed-redis
seed-pg:
	$(OPS_RUN) npx mikro-orm seeder:run
seed-redis:
	$(OPS_RUN) npx tsx ./src/infrastructure/redis/seeder.ts

# Test
test:
	NODE_OPTIONS=--experimental-vm-modules npx jest --config ./jest.unit.config.mjs
coverage:
	NODE_OPTIONS=--experimental-vm-modules npx jest --config ./jest.unit.config.mjs --coverage
