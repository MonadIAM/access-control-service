# @monadiam/access-control-service

----

<details>
<summary><strong>Local Deployment</strong></summary>

1. Make sure the [infra](https://github.com/MonadIAM/infra) repository is already running locally.

2. Make sure `DOCKER_NETWORK_KAFKA`, `DOCKER_NETWORK_MONITORING`, `DOCKER_NETWORK_VAULT`, and `DOCKER_NETWORK_CONSUL` in `.env` match the actual Docker network names (defaults below), or your custom ones.

3. Create shared Docker networks for inter-service communication, monitoring, Vault, and Consul (shared DCS for Patroni - see the PostgreSQL HA section below):
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
<summary><strong>PostgreSQL HA (Patroni)</strong></summary>

PostgreSQL runs as a Patroni-managed cluster instead of a hand-rolled primary/replica pair - automatic failover, no fixed "primary container".

#### Architecture
- *`postgresql-1` / `postgresql-2`* — symmetric Patroni-managed nodes; which one is leader vs. replica is decided at runtime via the shared Consul cluster (from `infra`), not fixed by container name.
- *`haproxy-write`* — routes to whichever node currently holds the leader lock (Patroni REST `GET /leader`). This is what `POSTGRES_WRITE_HOST`/`POSTGRES_HOST` point at.
- *`haproxy-read`* — routes to healthy replicas (Patroni REST `GET /replica`). This is what `POSTGRES_READ_HOST` points at.
- Both HAProxy instances build their backend list from the Consul service catalog via `consul-template` (`docker/haproxy/*.ctmpl`) - adding/removing a Patroni node needs no HAProxy config change.
- The Debezium outbox connector keeps a permanent logical replication slot (`outbox_slot`, registered in `docker/postgres/patroni.yml`) so it survives a leader failover without a full resync.

#### Checking cluster status
```sh
# Cluster-wide view (leader/replica roles, lag, timeline) via patronictl, from either node:
docker exec -it access-control-service-postgres-1 patronictl -c /patroni.yml list

# Per-node role via the Patroni REST API (port 8008 isn't published to the host, so this is run from inside the container):
docker exec -it access-control-service-postgres-1 curl -s http://127.0.0.1:8008/patroni
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
| `npx mikro-orm seeder:run --class=DemoSeeder`        | `make seed-demo`          | Run a specific seeder by class name.                               |
| **Test**                                             |                           |                                                                    |
| `npx jest --config ./jest.unit.config.ts`            | `make test`               | Run unit tests.                                                    |
| `npx jest --config ./jest.unit.config.ts --coverage` | `make coverage`           | Run unit tests with coverage report.                               |

</details>

----
