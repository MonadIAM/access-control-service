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
lint-fix:
	npm run lint:fix
knip:
	npm run knip
swagger:
	npm run swagger
postman:
	npm run postman
docs: swagger postman

# Database
migrate:
	npx mikro-orm migration:up
migration:
	npx mikro-orm migration:create --name=$(name)
seed: seed-pg seed-redis
seed-pg:
	npx mikro-orm seeder:run
seed-redis:
	npx tsx ./src/infrastructure/redis/seeder.ts

# Test
test:
	npx jest --config ./jest.unit.config.ts
coverage:
	npx jest --config ./jest.unit.config.ts --coverage
