.PHONY: coverage

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

# Database
migrate:
	npx mikro-orm migration:up
migration:
	npx mikro-orm migration:create --name=$(name)
seed:
	npx mikro-orm seeder:run
seed-demo:
	npx mikro-orm seeder:run --class=DemoSeeder

# Test
test:
	npx jest --config ./jest.unit.config.ts
coverage:
	npx jest --config ./jest.unit.config.ts --coverage
