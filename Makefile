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
