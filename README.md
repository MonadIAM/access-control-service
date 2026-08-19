# @monadiam/access-control-service

----

<details>
<summary><strong>Local Deployment</strong></summary>

1. Make sure the [infra](https://github.com/MonadIAM/infra) repository is already running locally.

2. Make sure `DOCKER_NETWORK_KAFKA`, `DOCKER_NETWORK_MONITORING`, `DOCKER_NETWORK_VAULT`, `DOCKER_NETWORK_POSTGRES`, `DOCKER_NETWORK_REDIS`, and `DOCKER_VOLUME_VAULT_CA` in `.env` match the actual shared Docker resource names (defaults below), or your custom ones.

3. Create shared Docker networks for inter-service communication, monitoring, Vault, PostgreSQL routing, and Redis:
```sh
docker network create monitoring-network
docker network create kafka-net
docker network create postgres-net
docker network create redis-net
docker network create vault-net
```

4. Install the Loki Docker plugin (allows log shipping without extra npm packages):
```sh
docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
```

</details>

----

<details>
<summary><strong>Project Commands</strong></summary>

| Command                                              | Makefile                  | Description                                                        |
|:-----------------------------------------------------|:--------------------------|:-------------------------------------------------------------------|
| **Infrastructure**                                   |                           |                                                                    |
| `[ -f .env.example ] && cp -f .env.example .env ...` | `make env`                | Generate `.env` from its example (if present).                     |
| `docker-compose up -d`                               | `make up`                 | Start all services in detached mode.                               |
| `docker-compose stop`                                | `make stop`               | Stop containers without removing them.                             |
| `docker-compose down`                                | `make down`               | Stop and remove containers and networks.                           |
| `make down && make up`                               | `make restart`            | Restart the entire infrastructure.                                 |
| `docker-compose build`                               | `make build`              | Build application Docker images.                                   |
| `docker-compose logs -f service`                     | `make logs`               | Stream logs from the main service.                                 |
| `docker-compose logs -f`                             | `make logs-all`           | Stream combined logs from all services.                            |
| `docker-compose ps`                                  | `make ps`                 | Show status of running containers.                                 |
| `docker-compose down -v`                             | `make clean`              | Remove containers along with volumes (wipes DB data).              |
| `docker system prune -f`                             | `make prune`              | Global cleanup of unused Docker resources.                         |
| **Development**                                      |                           |                                                                    |
| `npm run lint`                                       | `make lint`               | Run ESLint code checks.                                            |
| `npm run knip`                                       | `make knip`               | Detect unused exports, files, and dependencies.                    |
| `npm run swagger`                                    | `make swagger`            | Generate the OpenAPI Swagger JSON file.                            |
| `npm run postman`                                    | `make postman`            | Generate and patch the Postman collection JSON file.               |
| `npm run swagger && npm run postman`                 | `make docs`               | Generate Swagger and Postman documentation artifacts.              |
| **Database**                                         |                           |                                                                    |
| `npx mikro-orm migration:create --name=$(name)`      | `make migration name="*"` | Generate a new migration based on entity changes.                  |
| `npx mikro-orm migration:up`                         | `make migrate`            | Apply all pending migrations to the database.                      |
| `npx mikro-orm seeder:run`                           | `make seed`               | Run the default seeder (`SystemSeeder`).                           |
| **Test**                                             |                           |                                                                    |
| `npx jest --config ./jest.unit.config.ts`            | `make test`               | Run unit tests.                                                    |
| `npx jest --config ./jest.unit.config.ts --coverage` | `make coverage`           | Run unit tests with coverage report.                               |

</details>

----
