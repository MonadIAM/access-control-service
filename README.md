# @monadiam/access-control-service

----

<details>
<summary><strong>Local Deployment</strong></summary>

1. Make sure the [infra](https://github.com/MonadIAM/infra) repository is already running locally.

2. Make sure `DOCKER_NETWORK_KAFKA`, `DOCKER_NETWORK_MONITORING`, `DOCKER_NETWORK_POSTGRES`, `DOCKER_NETWORK_REDIS`, `DOCKER_NETWORK_VAULT`, `DOCKER_NETWORK_CONSUL`, `DOCKER_VOLUME_VAULT_CA`, and `DOCKER_VOLUME_SERVICE_TLS` in `.env` match the actual shared Docker resource names (defaults below), or your custom ones.

3. Create shared Docker networks for inter-service communication, monitoring, Vault, and Consul Connect. `postgres-net`, `redis-net`, `vault_ca`, and `service_tls` are created by the infra repo:
```sh
docker network create monitoring-network
docker network create consul-net
docker network create kafka-net
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

| Makefile                  | Description                                                        |
|:--------------------------|:-------------------------------------------------------------------|
| **Infrastructure**        |                                                                    |
| `make env`                | Generate `.env` from its example (if present).                     |
| `make up`                 | Build application and ops images, then start services.             |
| `make stop`               | Stop containers without removing them.                             |
| `make down`               | Stop and remove containers and networks.                           |
| `make restart`            | Restart the entire infrastructure.                                 |
| `make build-app`          | Build the application runtime image.                               |
| `make build-ops`          | Build the ops image used by migrations and seeders.                |
| `make build`              | Build application and ops images.                                  |
| `make logs`               | Stream logs from the main service.                                 |
| `make logs-all`           | Stream combined logs from all services.                            |
| `make ps`                 | Show status of running containers.                                 |
| `make clean`              | Remove containers along with volumes (wipes DB data).              |
| `make prune`              | Global cleanup of unused Docker resources.                         |
| **Development**           |                                                                    |
| `make lint`               | Run ESLint code checks.                                            |
| `make knip`               | Detect unused exports, files, and dependencies.                    |
| `make swagger`            | Generate the OpenAPI Swagger JSON file.                            |
| `make postman`            | Generate and patch the Postman collection JSON file.               |
| `make docs`               | Generate Swagger and Postman documentation artifacts.              |
| **Database**              |                                                                    |
| `make migration name="*"` | Generate a new migration through the prebuilt ops image.           |
| `make migrate`            | Apply all pending migrations through the prebuilt ops image.       |
| `make seed-pg`            | Seed PostgreSQL through the prebuilt ops image.                    |
| `make seed-redis`         | Seed Redis through the prebuilt ops image.                         |
| `make seed`               | Seed PostgreSQL and Redis.                                         |
| **Test**                  |                                                                    |
| `make test`               | Run unit tests.                                                    |
| `make coverage`           | Run unit tests with coverage report.                               |

</details>

----
