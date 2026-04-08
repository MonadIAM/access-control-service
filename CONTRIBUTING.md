# Contributing

----

<details>
<summary><strong>Environment Setup</strong></summary>

> The application requires `Node.js v22.17.0` and `npm v11.6.2`;
> other versions are not supported.

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
