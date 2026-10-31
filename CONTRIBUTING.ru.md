# Участие в разработке

Language: [EN](CONTRIBUTING.md) | **RU**

----

<details>
<summary><strong>Подготовка окружения</strong></summary>

> Для приложения нужны Node.js и pnpm, версии указанной в `package.json`.
> Другие версии не поддерживаются.

> Для Git-хуков установите [`jq`](https://jqlang.github.io/jq/download/)
> и [`gitleaks`](https://github.com/gitleaks/gitleaks#installing).
> Без них коммит не пройдёт проверку.

> Pre-commit запускает все модульные и интеграционные тесты. Docker должен быть
> запущен и доступен текущему пользователю. Testcontainers создаёт отдельные
> контейнеры PostgreSQL, Redis, Kafka и Schema Registry. Запускать инфраструктуру
> приложения и создавать локальный `.env` не нужно. При первом запуске скачиваются образы.

Команды проекта: [README](README.ru.md).

Рекомендуемый редактор — [VSCode](https://code.visualstudio.com/).

#### Настройка VSCode

Для интеграции [ESLint](https://eslint.org/docs/latest/), [Prettier](https://prettier.io/docs/en/)
и [EditorConfig](https://editorconfig.org/) установите расширения:

1. `dbaeumer.vscode-eslint`
2. `rvest.vs-code-prettier-eslint`
3. `esbenp.prettier-vscode`
4. `EditorConfig.EditorConfig`

</details>

----

<details>
<summary><strong>Git-хуки</strong></summary>

Подключите хуки:
```sh
chmod +x .githooks/*
git config core.hooksPath .githooks
```

#### Проверки перед коммитом

`pre-commit` выполняет проверки по порядку и останавливается при первой ошибке:

1. `Secret scan`       — поиск секретов через Gitleaks в подготовленных к коммиту изменениях.
2. `Environment`       — согласованность конфигурации окружения.
3. `Translations`      — согласованность словарей; см. `scripts/intl.check.sh`.
4. `Type check`        — проверка типов TypeScript во всём проекте.
5. `Unused code`       — поиск неиспользуемых экспортов, файлов и зависимостей.
6. `Lint`              — ESLint во всём проекте, тот же скрипт, что и в CI.
7. `Unit tests`        — все модульные тесты в режиме CI Jest.
8. `Integration tests` — все интеграционные тесты в режиме CI Jest.

Если Docker недоступен или тесты падают, коммит отклоняется. Проверки выполняются
на рабочей копии, включая изменения, не добавленные в коммит. CI проверяет PR в `dev`.

#### Допустимые префиксы коммитов и веток

`feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

#### Формат сообщения коммита

```text
<type>(<scope>)?[!]: <subject>
```

- `<type>` — один из допустимых префиксов.
- `<scope>` — необязательная область изменений в скобках: латинские буквы, цифры и `-`.
- `!` — необязательная отметка несовместимого изменения.
- `: ` — обязательные двоеточие и пробел.
- `<subject>` — краткое описание изменения.

> Первая строка сообщения коммита — не более 70 символов.

Примеры:

- `feat: add filters to user search`
- `fix(auth): handle invalid jwt token`
- `refactor(user-service)!: drop legacy ws implementation`
- `docs: update api usage section`
- `chore(ci): tweak lint step`

#### Формат имени ветки

```text
<type>/<slug>
<type>/<scope-or-id>/<slug>
```

- `<type>` — один из допустимых префиксов.
- `/<scope-or-id>` — необязательная область или номер задачи: латинские буквы, цифры и `-`.
- `/<slug>` — краткое описание: латинские буквы, цифры, `_` и `-`.

Примеры:

- `feat/add-user-search-filters`
- `fix/schedule-update-ws-event`
- `refactor/core-user-cleanup`
- `feat/GOTEC-404/add-notifications-for-users`

> Исключения: `dev`, `main`, `master`.

</details>

----

<details>
<summary><strong>Выпуск новой версии</strong></summary>

1. Создайте ветку и обновите `version` в `package.json`. Ниже пример для `1.0.0`:
```bash
git switch dev
git pull --ff-only
git switch -c chore/release-v1.0.0
# Обновите версию в package.json перед коммитом.
git add package.json
git commit -m "chore: release v1.0.0"
git push -u origin chore/release-v1.0.0
```

2. Откройте PR в `dev`, дождитесь успешного CI, слейте PR и дождитесь завершения **Publish service image**.

3. Создайте тег на коммите с опубликованным образом; тег должен соответствовать `package.json`:
```bash
git switch dev
git pull --ff-only
git tag v1.0.0
git push origin v1.0.0
```

</details>

----
