# Contributing

Language: **EN** | [RU](CONTRIBUTING.ru.md)

----

<details>
<summary><strong>Environment Setup</strong></summary>

> The application requires the Node.js and pnpm versions specified in `package.json`.
> Other versions are not supported.

> Git hooks require [`jq`](https://jqlang.github.io/jq/download/)
> and [`gitleaks`](https://github.com/gitleaks/gitleaks#installing).
> A commit is rejected if either tool is missing.

> Pre-commit also runs the complete unit and integration suites. Docker must be
> running and accessible to the current user. Testcontainers starts isolated
> PostgreSQL, Redis, Kafka and Schema Registry containers; the application stack
> and a local `.env` are not required. The first run downloads container images.

Project commands: [README](README.md).

[VSCode](https://code.visualstudio.com/) is the recommended editor for development.

#### VSCode Setup

Install the following extensions for proper [ESLint](https://eslint.org/docs/latest/), 
[Prettier](https://prettier.io/docs/en/), and [EditorConfig](https://editorconfig.org/) integration:

1. `dbaeumer.vscode-eslint`
2. `rvest.vs-code-prettier-eslint`
3. `esbenp.prettier-vscode`
4. `EditorConfig.EditorConfig`

</details>

----

<details>
<summary><strong>Git Hooks</strong></summary>

Enable Git hooks:
```sh
chmod +x .githooks/*
git config core.hooksPath .githooks
```

#### Pre-commit Checks

`pre-commit` runs the steps below in order and stops at the first failure:

1. `Secret scan`       — Gitleaks on staged changes.
2. `Environment`       — environment configuration consistency.
3. `Translations`      — dictionary consistency, see `scripts/intl.check.sh`.
4. `Type check`        — TypeScript check of the whole project.
5. `Unused code`       — unused exports, files, and dependencies.
6. `Lint`              — ESLint on the whole project, using the same script as CI.
7. `Unit tests`        — the complete unit suite in Jest CI mode.
8. `Integration tests` — the complete integration suite in Jest CI mode.

The hook rejects the commit if Docker is unavailable or a test fails. Checks run
against the working tree, including unstaged changes. CI checks PR to `dev`.

#### Allowed Commit and Branch Prefixes

`feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

#### Commit Message Format

```text
<type>(<scope>)?[!]: <subject>
```

- `<type>` — one of the allowed prefixes above.
- `<scope>` — optional scope in parentheses, alphanumeric/`-`.
- `!` — optional breaking change marker.
- `: ` — colon + space are required.
- `<subject>` — short description.

> The commit subject line is limited to 70 characters.

Examples:

- `feat: add filters to user search`
- `fix(auth): handle invalid jwt token`
- `refactor(user-service)!: drop legacy ws implementation`
- `docs: update api usage section`
- `chore(ci): tweak lint step`

#### Branch Naming Format

```text
<type>/<slug>
<type>/<scope-or-id>/<slug>
```

- `<type>` — one of the prefixes listed above.
- `/<scope-or-id>` — optional part, alphanumeric/`-`.
- `/<slug>` — short description, alphanumeric/`_`/`-`.

Examples:

- `feat/add-user-search-filters`
- `fix/schedule-update-ws-event`
- `refactor/core-user-cleanup`
- `feat/GOTEC-404/add-notifications-for-users`

> Exceptions: `dev`, `main`, `master`.

</details>

----

<details>
<summary><strong>Releasing a new version</strong></summary>

1. Create a branch and update `version` in `package.json`. The example below uses `1.0.0`:
```bash
git switch dev
git pull --ff-only
git switch -c chore/release-v1.0.0
# Update the version in package.json before committing.
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
