# @MonadIAM/access-control-service

----

<details>
<summary><strong>Local Deployment</strong></summary>

1. Make sure the [infra](https://github.com/MonadIAM/infra) repository is already running locally.

2. Make sure the `DOCKER_NETWORK_NAME` value in `.env` matches `monitoring-network` or your custom network.

3. Create shared Docker networks for inter-service communication and monitoring:
```sh
docker network create kafka-net
docker network create monitoring-network
```

4. Install the Loki Docker plugin (allows log shipping without extra npm packages):
```sh
docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
```

</details>

----

<details>
<summary><strong>PostgreSQL Streaming Replication</strong></summary>

The service uses `PostgreSQL` in streaming replication mode to improve read performance.

#### Architecture
- *Primary* (`postgresql-primary`) — main write instance (port `5432`)
- *Replica* (`postgresql-replica`) — read-only replica (port `5433`)

#### Checking replication status
```sh
# Check on primary:
docker exec -it access-control-service-postgres-primary psql -U lambdius -d access-control-service -c "SELECT * FROM pg_stat_replication;"
# Check on replica:
docker exec -it access-control-service-postgres-replica psql -U lambdius -d access-control-service -c "SELECT pg_is_in_recovery();"
# Should return `t` (true), meaning the replica is in recovery mode (read-only).
```

</details>

----

<details>
<summary><strong>Project Commands</strong></summary>

| Command                                                         | Makefile                         | Description                                           |
|:----------------------------------------------------------------|:---------------------------------|:------------------------------------------------------|
| **Infrastructure**                                              |                                  |                                                       |
| `[ -f .env.example ] && cp -f .env.example .env`                | `make env`                       | Generate `.env` from example (if file exists).        |
| `docker-compose up -d`                                          | `make up`                        | Start all services in detached mode.                  |
| `docker-compose stop`                                           | `make stop`                      | Stop containers without removing them.                |
| `docker-compose down`                                           | `make down`                      | Stop and remove containers and networks.              |
| `make down && make up`                                          | `make restart`                   | Restart the entire infrastructure.                    |
| `docker-compose build`                                          | `make build`                     | Build application Docker images.                      |
| `docker-compose logs -f service`                                | `make logs`                      | Stream logs from the main service.                    |
| `docker-compose logs -f`                                        | `make logs-all`                  | Stream combined logs from all services.               |
| `docker-compose ps`                                             | `make ps`                        | Show status of running containers.                    |
| `docker-compose down -v`                                        | `make clean`                     | Remove containers along with volumes (wipes DB data). |
| `docker system prune -f`                                        | `make prune`                     | Global cleanup of unused Docker resources.            |
| **Development**                                                 |                                  |                                                       |
| `npm run lint`                                                  | `make lint`                      | Run ESLint code checks.                               |
| `npm run lint:fix`                                              | `make lint-fix`                  | Auto-fix formatting and log changed files.            |
| `npm run knip`                                                  | `make knip`                      | Detect unused exports, files, and dependencies.       |
| `npm run swagger`                                               | `make swagger`                   | Generate the OpenAPI Swagger JSON file.               |
| `npm run postman`                                               | `make postman`                   | Generate and patch the Postman collection JSON file.  |
| `npm run swagger && npm run postman`                            | `make docs`                      | Generate Swagger and Postman documentation artifacts. |
| **Database**                                                    |                                  |                                                       |
| `npx mikro-orm migration:create --name=$(name)`                 | `make migration name="*"`        | Generate a new migration based on entity changes.     |
| `npx mikro-orm migration:up`                                    | `make migrate`                   | Apply all pending migrations to the database.         |
| `make seed-pg && make seed-redis`                               | `make seed`                      | Seed PostgreSQL and Redis (full seed).                |
| `npx mikro-orm seeder:run`                                      | `make seed-pg`                   | Seed PostgreSQL.                                      |
| `npx tsx ./src/infrastructure/redis/seeder.ts`                  | `make seed-redis`                | Seed Redis projection cache.                          |
| **Test**                                                        |                                  |                                                       |
| `npx jest --config ./jest.unit.config.ts`                       | `make test`                      | Run unit tests.                                       |
| `npx jest --config ./jest.unit.config.ts --coverage`            | `make coverage`                  | Run unit tests with coverage report.                  |


</details>

----
