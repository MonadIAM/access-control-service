# Contributing

----

<details>
<summary><strong>Environment Setup</strong></summary>

> The application requires `Node.js v24.18.0` and the pnpm version pinned in `package.json`;
> other versions are not supported.

> The git hooks additionally require [`jq`](https://jqlang.github.io/jq/download/)
> and [`gitleaks`](https://github.com/gitleaks/gitleaks#installing) to be available
> in `PATH`; a commit is rejected when either of them is missing.

> Pre-commit also runs the complete unit and integration suites. Docker must be
> running and accessible to the current user. Testcontainers starts isolated
> PostgreSQL, Redis, Kafka and Schema Registry containers; the application stack
> and a local `.env` are not required. The first run downloads container images.

[VSCode](https://code.visualstudio.com/) is the recommended editor for development.

#### VSCode Setup
Install the following extensions for proper [ESLint](https://eslint.org/docs/latest/), [Prettier](https://prettier.io/docs/en/), and [EditorConfig](https://editorconfig.org/) integration:
1. `dbaeumer.vscode-eslint`
2. `rvest.vs-code-prettier-eslint`
3. `esbenp.prettier-vscode`
4. `EditorConfig.EditorConfig`

</details>

----

<details>
<summary><strong>Git Hooks</strong></summary>

*Enable git hooks:*
```sh
chmod +x .githooks/*
git config core.hooksPath .githooks
```

#### Checks executed on commit:
`pre-commit` runs the steps below in order and stops at the first failure:
 1. `Secret scan` — Gitleaks on staged changes.
 2. `Environment` — environment configuration consistency.
 3. `Translations` — dictionary consistency, see `scripts/intl.check.sh`.
 4. `Type check` — TypeScript check of the whole project.
 5. `Unused code` — unused exports, files, and dependencies.
 6. `Lint` — ESLint on the whole project, using the same script as CI.
 7. `Unit tests` — the complete unit suite in Jest CI mode.
 8. `Integration tests` — the complete integration suite in Jest CI mode.

The hook rejects the commit if Docker is unavailable or a test fails. Checks run
against the working tree, including unstaged changes. CI checks PR to `dev`.

#### Allowed prefixes for commits and branches:
`feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

#### Commit message format:
```text
<type>(<scope>)?[!]: <subject>
```

*Where:*
 - `<type>`    — one of the allowed prefixes above.
 - `<scope>`   — optional scope in parentheses, alphanumeric/`-`.
 - `!`         — optional breaking change marker.
 - `: `        — colon + space are required.
 - `<subject>` — short description.
> Total commit message length is limited to 70 characters.

*Valid commit examples:*
 - `feat: add filters to user search`
 - `fix(auth): handle invalid jwt token`
 - `refactor(user-service)!: drop legacy ws implementation`
 - `docs: update api usage section`
 - `chore(ci): tweak lint step`

#### Branch naming format:
```text
<type>/<slug>
<type>/<scope-or-id>/<slug>
```

*Where:*
 - `<type>`         — one of the prefixes listed above.
 - `/<scope-or-id>` — optional part, alphanumeric/`-`.
 - `/<slug>`        — short description, alphanumeric/`_`/`-`.

*Valid branch examples:*
 - `feat/add-user-search-filters`
 - `fix/schedule-update-ws-event`
 - `refactor/core-user-cleanup`
 - `feat/GOTEC-404/add-notifications-for-users`

> Exceptions: `dev`, `main`, `master`.

</details>

----
