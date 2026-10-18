# @monadiam/access-control-service

IAM | Access Control & AuthZ: hierarchical RBAC, DAC permission overrides, separation of duties (SoD), role delegation policies and realm-scoped access control.

----

<details>
<summary><strong>Local Code Graph (Graphify)</strong></summary>

Install once with [uv](https://docs.astral.sh/uv/), then open a new terminal:

```sh
uv tool install graphifyy==0.9.65
uv tool update-shell
```

Run `make graphify` from the repository root to create or update the local code
graph and report. No API key is required. Outputs in `graphify-out/` are ignored
by Git. Agent guidance: [AGENTS.md](AGENTS.md).

</details>

----

<details>
<summary><strong>Local TypeScript Navigation (LSP-MCP)</strong></summary>

[lsmcp](https://github.com/mizchi/lsmcp) and TypeScript Language Server are pinned
dev dependencies. Install with `pnpm install` using the Node version from
`package.json`. Run `make lsp` from the repository root to start the stdio MCP
server; an MCP client must connect to it to issue queries.

For an MCP client, use command `node`, arguments
`["node_modules/@mizchi/lsmcp/dist/lsmcp.js", "--config", ".lsmcp/config.json"]`,
and set its working directory to this repository. Desktop clients may need an
absolute Node executable path. Configuration: [.lsmcp/config.json](.lsmcp/config.json).
Local indexes and caches are ignored by Git. Agent guidance: [AGENTS.md](AGENTS.md).

Known limitation in lsmcp 0.10.0: definition previews can be empty for encoded
pnpm dependency paths. Hover still works; `resolve_symbol` locates the installed
package entry point. See [AGENTS.md](AGENTS.md) for the fallback.

</details>

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
| :------------ | :------------------------------- |
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
<summary><strong>Stand Configuration</strong></summary>

Runtime settings: [.env.stand.example](.env.stand.example). Compose settings are
optional for the application; Kubernetes supplies env and mounted Secrets.

| Connection | Stand mode                            | Mounted files / credentials                                    |
| :--------- | :------------------------------------ | :------------------------------------------------------------- |
| PostgreSQL | CNPG `rw` / `ro`, TLS, password       | `/tls/postgresql/ca.crt`; `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| Redis      | Sentinel, master discovery, mTLS      | `/tls/redis/{ca.crt,tls.crt,tls.key}`; `REDIS_PASSWORD`        |
| Kafka      | TLS + SCRAM-SHA-512                   | `/tls/kafka/ca.crt`; `/secrets/kafka/password`                 |
| Vault      | Transit through the Agent Unix socket | `/vault/proxy/agent.sock`, shared with the Agent sidecar       |

**Migrations and seeding**

```sh
kubectl exec -n monadiam-apps <pod> -c service -- make migrate
kubectl exec -n monadiam-apps <pod> -c service -- make seed
```

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

| Makefile                          | Description                                                                   |
| :-------------------------------- | :---------------------------------------------------------------------------- |
| **Infrastructure**                |                                                                               |
| `make env`                        | Create `.env` from `.env.local.example`.                                      |
| `make build`                      | Build the local Compose image.                                                |
| `make up`                         | Start service, Vault bootstrap, and Vault Agent.                              |
| `make down`                       | Stop and remove service containers.                                           |
| `make restart`                    | Run `make down` and `make up`.                                                |
| **Development**                   |                                                                               |
| `make lint`                       | Run ESLint code checks.                                                       |
| `make lint-fix`                   | Fix only Prettier violations and print changed file paths.                    |
| `make tsc`                        | Check TypeScript with tsc --noEmit.                                           |
| `make knip`                       | Detect unused exports, files, and dependencies.                               |
| `make secrets-check`              | Run the hook secret scan (staged changes).                                    |
| `make env-check`                  | Validate environment DTO, templates and injected keys.                        |
| `make intl-types`                 | Generate TypeScript types from the translation dictionaries.                  |
| `make intl-check`                 | Run all six dictionary checks used by the Git hook.                           |
| `make lsp`                        | Start the local TypeScript MCP server over stdio.                             |
| `make graphify`                   | Create or update the local code graph and Markdown report.                    |
| `make graphify-rebuild`           | Rescan all code files and regenerate the report.                              |
| `make graphify-html`              | Update the graph and report, then export HTML visualization.                  |
| `make swagger`                    | Generate the OpenAPI Swagger JSON file.                                       |
| `make postman`                    | Generate and patch the Postman collection JSON file.                          |
| `make docs`                       | Generate Swagger and Postman documentation artifacts.                         |
| **Database**                      |                                                                               |
| `make migrate`                    | Apply pending MikroORM migrations in the running service container.           |
| `make migration name="..."`       | Generate a MikroORM migration in the running service container.               |
| `make empty-migration name="..."` | Generate a blank MikroORM migration.                                          |
| `make seed-postgresql`            | Replace the PostgreSQL dataset.                                               |
| `make seed-redis`                 | Replace Redis projections.                                                    |
| `make seed`                       | Run PostgreSQL seeder, then Redis projection seeder.                          |
| **Container / GHCR**              |                                                                               |
| `make image`                      | Build the production image; accepts `IMAGE`, `BASE_IMAGE`, `VCS_REF`.         |
| `make image-publish`              | Publish the commit SHA image (GitHub Actions).                                |
| `make image-release`              | Tag the published SHA image with the package version (GitHub Actions).        |
| `make image-cleanup`              | Keep the last 10 intermediate SHA images; preserve releases (GitHub Actions). |
| **Test**                          |                                                                               |
| `make test`                       | Run unit and integration tests (Docker required).                             |
| `make utest`                      | Run the complete unit suite.                                                  |
| `make itest`                      | Run integration tests (Docker required).                                      |
| `make coverage-unit`              | Run unit tests with coverage in `coverage/unit`.                              |
| `make coverage-integration`       | Run integration tests with coverage in `coverage/integration`.                |
| `make coverage`                   | Run both suites with combined coverage in `coverage/all`.                     |

The seed command executes `db:seed:postgresql` first and `db:seed:redis` second.

</details>

----

<details>
<summary><strong>Container package (GHCR)</strong></summary>

`ghcr.io/monadiam/access-control-service`

| Event         | Action                                                                                                         |
| :------------ | :------------------------------------------------------------------------------------------------------------- |
| PR to `dev`   | Existing checks and production image build; no publication                                                     |
| Push to `dev` | Build merged commit and publish `sha-<commit>`                                                                 |
| Tag `vX.Y.Z`  | Require matching `package.json` version and a commit in `dev`; tag its SHA image as `X.Y.Z` without rebuilding |
| Cleanup       | Retain 10 SHA-only versions; preserve release tags                                                             |
| Stand         | Pin the released image by digest                                                                               |

[CI](.github/workflows/ci.yml), [publication](.github/workflows/publish.yml),
[release](.github/workflows/release.yml), [package operations](.github/scripts/packages.sh).

[Dockerfile](docker/app/Dockerfile) targets: `development` for Compose and migration tooling;
`runner` for GHCR, with production dependencies, compiled application, TypeScript sources
for CLI commands, and a non-root user. The pinned `pnpm` is cached during image build;
CLI commands use `pnpm` and `tsx` in both targets. Both targets include `make`; database commands run directly inside
the container and through Compose when called from the host. Startup runs the service only.

</details>

----

<details>
<summary><strong>Releasing a new version</strong></summary>

1. Prepare a branch and set `version` in `package.json` (`1.0.0` for the first release):
```bash
git switch dev
git pull --ff-only
git switch -c chore/release-v1.0.0
# Update package.json before committing.
git add package.json
git commit -m "chore: release v1.0.0"
git push -u origin chore/release-v1.0.0
```
2. Open a PR into `dev`, pass CI, merge and wait for **Publish service image** to succeed.
3. Tag the published commit; the tag must match `package.json`:
```bash
git switch dev
git pull --ff-only
git tag v1.0.0
git push origin v1.0.0
```

</details>

----
