# @monadiam/access-control-service

Access Control Service implements HRBAC, DAC, SoD, delegation policies,
multitenancy, audit log, and change log.

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
| `make lint-fix`                   | Fix only Prettier violations and print changed file paths.          |
| `make tsc`                        | Check TypeScript with tsc --noEmit.                                 |
| `make knip`                       | Detect unused exports, files, and dependencies.                     |
| `make secrets-check`              | Run the hook secret scan (staged changes).                          |
| `make env-check`                  | Validate environment DTO, templates and injected keys.              |
| `make intl-types`                 | Generate TypeScript types from the translation dictionaries.        |
| `make intl-check`                 | Run all six dictionary checks used by the Git hook.                 |
| `make lsp`                        | Start the local TypeScript MCP server over stdio.                   |
| `make graphify`                   | Create or update the local code graph and Markdown report.          |
| `make graphify-rebuild`           | Rescan all code files and regenerate the report.                    |
| `make graphify-html`              | Update the graph and report, then export HTML visualization.        |
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
