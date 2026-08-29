# @monadiam/access-control-service

Access Control Service implements HRBAC, DAC, SoD, delegation policies,
multitenancy, audit log, and change log.

----

<details>
<summary><strong>Local Deployment</strong></summary>

1. Start the [infra](https://github.com/MonadIAM/infra) repository first.

2. Start [identity-service](https://github.com/MonadIAM/identity-service) when
JWT verification through JWKS is required.

3. Create the local env file:

```sh
make env
```

4. Build and start the service:

```sh
make build
make up
```

The local service container depends on:

| Dependency    | Address inside Docker network    |
|:--------------|:---------------------------------|
| PostgreSQL    | `access-control-postgresql:5432` |
| Redis         | `access-control-redis:6379`      |
| Kafka         | `kafka:29092`                    |
| Vault         | `vault:8200`                     |
| Identity JWKS | `identity-service-app:4002`      |

Shared Docker networks are created by the infra repository:
`postgres-net`, `redis-net`, `kafka-net`, and `vault-net`.

</details>

----

<details>
<summary><strong>Local Ports</strong></summary>

| Resource   | Port                                 |
|:-----------|:-------------------------------------|
| HTTP API   | `4001`                               |
| gRPC       | `50051` inside service container     |
| PostgreSQL | `6001` on host, `5432` inside Docker |
| Redis      | `7001` on host, `6379` inside Docker |

</details>

----

<details>
<summary><strong>Project Commands</strong></summary>

| Makefile                          | Description                                                         |
|:----------------------------------|:--------------------------------------------------------------------|
| **Infrastructure**                |                                                                     |
| `make env`                        | Create `.env` from `.env.local.example`.                            |
| `make build`                      | Build the application image.                                        |
| `make up`                         | Start service, Vault bootstrap, and Vault Agent.                    |
| `make down`                       | Stop and remove service containers.                                 |
| `make restart`                    | Run `make down` and `make up`.                                      |
| **Development**                   |                                                                     |
| `make lint`                       | Run ESLint code checks.                                             |
| `make knip`                       | Detect unused exports, files, and dependencies.                     |
| `make swagger`                    | Generate the OpenAPI Swagger JSON file.                             |
| `make postman`                    | Generate and patch the Postman collection JSON file.                |
| `make docs`                       | Generate Swagger and Postman documentation artifacts.               |
| **Database**                      |                                                                     |
| `make migrate`                    | Apply pending MikroORM migrations in the running service container. |
| `make migration name="..."`       | Generate a MikroORM migration in the running service container.     |
| `make empty-migration name="..."` | Generate a blank MikroORM migration.                                |
| `make seed`                       | Run PostgreSQL seeder, then Redis projection seeder.                |
| **Test**                          |                                                                     |
| `make test`                       | Run unit tests.                                                     |
| `make coverage`                   | Run unit tests with coverage report.                                |

The seed command executes `db:seed:postgresql` first and `db:seed:redis` second.

</details>

----
