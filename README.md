# @monadiam/access-control-service

Language: **EN** | [RU](README.ru.md)

IAM | Access Control & AuthZ: hierarchical RBAC, DAC permission overrides, separation of duties (SoD), role delegation policies and realm-scoped access control.

----

<details>
<summary><strong>Local Deployment</strong></summary>

1. Start the [infrastructure](https://github.com/MonadIAM/infrastructure/tree/local) repository first, using its `local` branch.

2. Start [identity-service](https://github.com/MonadIAM/identity-service) when
JWT verification through JWKS is required.

3. Create the local environment file:
```sh
make env
```

4. Build and start the service:
```sh
make build
make up
```

Dependency addresses inside the Docker network:

| Dependency    | Address inside Docker network    |
| :------------ | :------------------------------- |
| PostgreSQL    | `access-control-postgresql:5432` |
| Redis         | `access-control-redis:6379`      |
| Kafka         | `kafka:29092`                    |
| Vault         | `vault:8200`                     |
| Identity JWKS | `identity-service-app:4002`      |

Shared Docker networks are created by the infrastructure repository:
`postgres-net`, `redis-net`, `kafka-net`, and `vault-net`.

</details>

----

<details>
<summary><strong>Local Ports</strong></summary>

| Resource   | Port                                 |
| :--------- | :----------------------------------- |
| HTTP API   | `4001`                               |
| gRPC       | `50051` inside service container     |
| PostgreSQL | `6001` on host, `5432` inside Docker |
| Redis      | `7001` on host, `6379` inside Docker |

</details>

----

<details>
<summary><strong>Project Commands</strong></summary>

| Makefile                          | Description                                                                                |
| :-------------------------------- | :----------------------------------------------------------------------------------------- |
| **Infrastructure**                |                                                                                            |
| `make env`                        | Create `.env` from `.env.local.example`.                                                   |
| `make build`                      | Build the local Compose image.                                                             |
| `make up`                         | Start service, Vault bootstrap, and Vault Agent.                                           |
| `make down`                       | Stop and remove service containers.                                                        |
| `make restart`                    | Run `make down` and `make up`.                                                             |
| **Development**                   |                                                                                            |
| `make lint`                       | Run ESLint code checks.                                                                    |
| `make lint-fix`                   | Fix only Prettier violations and print changed file paths.                                 |
| `make tsc`                        | Check TypeScript types without building (`tsc --noEmit`).                                  |
| `make knip`                       | Detect unused exports, files, and dependencies.                                            |
| `make secrets-check`              | Scan staged changes for secrets with Gitleaks.                                             |
| `make env-check`                  | Check consistency between the environment DTO, env templates, and configuration variables. |
| `make intl-types`                 | Generate TypeScript types from the translation dictionaries.                               |
| `make intl-check`                 | Run all six dictionary checks used by the Git hook.                                        |
| **Database**                      |                                                                                            |
| `make migrate`                    | Apply pending MikroORM migrations in the running service container.                        |
| `make migration name="..."`       | Generate a MikroORM migration in the running service container.                            |
| `make empty-migration name="..."` | Generate a blank MikroORM migration.                                                       |
| `make seed-postgresql`            | Replace the PostgreSQL dataset.                                                            |
| `make seed-redis`                 | Replace Redis projections.                                                                 |
| `make seed`                       | Run PostgreSQL seeder, then Redis projection seeder.                                       |
| **Test**                          |                                                                                            |
| `make test`                       | Run unit and integration tests (Docker required).                                          |
| `make utest`                      | Run unit tests.                                                                            |
| `make itest`                      | Run integration tests (Docker required).                                                   |
| `make coverage-unit`              | Run unit tests with coverage in `coverage/unit`.                                           |
| `make coverage-integration`       | Run integration tests with coverage in `coverage/integration`.                             |
| `make coverage`                   | Run both suites with combined coverage in `coverage/all`.                                  |
| **Container / GHCR (internal)**   |                                                                                            |
| `make image`                      | Build the production image; also available locally with `IMAGE`, `BASE_IMAGE`, `VCS_REF`.  |
| `make image-publish`              | Publish the commit SHA image (GitHub Actions).                                             |
| `make image-release`              | Tag the published SHA image with the package version (GitHub Actions).                     |
| `make image-cleanup`              | Keep the last 10 intermediate SHA images; preserve releases (GitHub Actions).              |
| **LLM Tools (experimental)**      |                                                                                            |
| `make lsp`                        | Start the local TypeScript MCP server over stdio.                                          |
| `make graphify`                   | Create or update the local code graph and Markdown report.                                 |
| `make graphify-rebuild`           | Rebuild the code graph and report with a full project scan.                                |
| `make graphify-html`              | Update the graph and report, then export HTML visualization.                               |

</details>

----

<details>
<summary><strong>Stand Configuration</strong></summary>

Runtime settings: [.env.stand.example](.env.stand.example). Kubernetes supplies environment
variables and mounted Secrets; Compose settings are not used on the stand.

| Connection | Stand mode                                  | Mounted files / credentials                                      |
| :--------- | :------------------------------------------ | :--------------------------------------------------------------- |
| PostgreSQL | CNPG `rw` / `ro`, TLS, password             | `/tls/postgresql/ca.crt`; `POSTGRES_USER`, `POSTGRES_PASSWORD`   |
| Redis      | Sentinel, master discovery, mTLS            | `/tls/redis/{ca.crt,tls.crt,tls.key}`; `REDIS_PASSWORD`          |
| Kafka      | TLS + SCRAM-SHA-512                         | `/tls/kafka/ca.crt`; `/secrets/kafka/password`                   |
| Vault      | Transit through the Vault Agent Unix socket | `/vault/proxy/agent.sock`, shared with the Vault Agent container |

**Migrations and seeding**

```sh
kubectl exec -n monadiam-apps <pod> -c service -- make migrate
kubectl exec -n monadiam-apps <pod> -c service -- make seed
```

</details>

----

<details>
<summary><strong>Container package (GHCR)</strong></summary>

`ghcr.io/monadiam/access-control-service`

| Event         | Action                                                                                                         |
| :------------ | :------------------------------------------------------------------------------------------------------------- |
| PR to `dev`   | Checks and service image build; no publication                                                                 |
| Push to `dev` | Build merged commit and publish `sha-<commit>`                                                                 |
| Tag `vX.Y.Z`  | Require matching `package.json` version and a commit in `dev`; tag its SHA image as `X.Y.Z` without rebuilding |
| Cleanup       | Retain 10 SHA-only versions; preserve release tags                                                             |
| Stand         | Pin the released image by digest                                                                               |

[CI](.github/workflows/ci.yml), [publication](.github/workflows/publish.yml),
[release](.github/workflows/release.yml), [package operations](.github/scripts/packages.sh).

[Dockerfile](docker/app/Dockerfile) targets:

| Target        | Purpose                                                                                              |
| :------------ | :--------------------------------------------------------------------------------------------------- |
| `development` | Local Compose deployment and migration tooling                                                       |
| `runner`      | GHCR image: production dependencies, compiled code, TypeScript for CLI commands, and a non-root user |

Both targets include `make`, `pnpm`, and `tsx`. The pinned `pnpm` version is cached
during the build. Database commands run inside the container. The host Makefile
invokes them through Compose. Container startup runs only the service.

</details>

----
