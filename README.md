# access-control-service

----

<details>
<summary><strong>Локальное развертывание</strong></summary>

1. Убедитесь что репозиторий [IAM-Infra](https://github.com/Lambdius/IAM-Infra) уже запущен локально.

2. Убедитесь что значение `DOCKER_NETWORK_NAME` в `.env` соответствуте `monitoring-network` или вашей кастомнйо сети.

3. Создание общих Docker-сетей для взаимодействия между микросервисами и работы системы мониторинга необходимо создать внешние сети вручную:
```sh
docker network create kafka-net
docker network create monitoring-network
```

4. Для работы Loki без лишних npm пакетов необходимо установить плагин для Docker:
```sh
docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
```

</details>

----

<details>
<summary><strong>Переменное окружение</strong></summary>

Если файл `.env` отсутствует, при запуске приложения он автоматически создаётся на основе `.env.example`.

| #  | Переменная                           | Описание                                                                        |
|:--:|:-------------------------------------|:--------------------------------------------------------------------------------|
|    | <center>**Общие настройки**</center> |                                                                                 |
| 1  | `SERVICE_NAME`                       | Название сервиса (используется для логирования и префикса Kafka GroupID).       |
| 2  | `NODE_ENV`                           | Режим окружения (`development`, `production`, `test`).                          |
| 3  | `APP_BASE_IMAGE`                     | Базовый Docker-образ для сборки и запуска Node.js приложения.                   |
| 4  | `APP_HOST`                           | Сетевой интерфейс, который прослушивает приложение (стандартно `0.0.0.0`).      |
| 5  | `APP_PORT`                           | Порт HTTP-сервера приложения (например, `5001`).                                |
|    | <center>**PostgreSQL**</center>      |                                                                                 |
| 6  | `POSTGRESQL_IMAGE`                   | Docker-образ PostgreSQL.                                                        |
| 7  | `POSTGRESQL_HOST`                    | Хост базы данных PostgreSQL внутри Docker-сети.                                 |
| 8  | `POSTGRESQL_PORT`                    | Порт PostgreSQL (стандартно `5432`).                                            |
| 9  | `POSTGRESQL_USER`                    | Имя пользователя базы данных.                                                   |
| 10 | `POSTGRESQL_PASS`                    | Пароль пользователя базы данных.                                                |
| 11 | `POSTGRESQL_NAME`                    | Имя целевой базы данных.                                                        |
| 12 | `POSTGRESQL_SSL`                     | Включение SSL-соединения с БД (`true`/`false`).                                 |
| 13 | `POSTGRESQL_SSL_REJECT_UNAUTHORIZED` | Проверка сертификата при SSL-соединении.                                        |
| 14 | `POSTGRESQL_POOL_IDLE_MS`            | Таймаут простоя соединения в пуле (мс). Рекомендовано 30000.                    |
| 15 | `POSTGRESQL_POOL_MAX`                | Максимальное количество соединений в пуле на один процесс приложения.           |
| 16 | `POSTGRESQL_LOGGING`                 | Включение логирования SQL-запросов (в prod рекомендуется `false`).              |
|    | <center>**Redis**</center>           |                                                                                 |
| 17 | `REDIS_IMAGE`                        | Docker-образ Redis.                                                             |
| 18 | `REDIS_HOST`                         | Хост сервера Redis внутри Docker-сети.                                          |
| 19 | `REDIS_PORT`                         | Порт сервера Redis (стандартно `6379`).                                         |
| 20 | `REDIS_PASSWORD`                     | Пароль для доступа к Redis.                                                     |
| 21 | `REDIS_DB_CACHE`                     | Индекс базы данных Redis для кэширования.                                       |
| 22 | `REDIS_DB_LIMITER`                   | Индекс базы данных Redis для Rate Limiter'ов.                                   |
| 23 | `REDIS_DB_QUEUE`                     | Индекс базы данных Redis для очередей задач (BullMQ).                           |
|    | <center>**Kafka & Network**</center> |                                                                                 |
| 24 | `KAFKA_BROKER`                       | Адрес брокера Kafka (например, `kafka:29092`).                                  |
| 25 | `KAFKA_RETRY_ATTEMPTS`               | Количество попыток переподключения к брокеру.                                   |
| 26 | `KAFKA_RETRY_INITIAL_TIME`           | Начальная задержка между попытками подключения (в мс).                          |
| 27 | `DOCKER_NETWORK_NAME`                | Имя внешней Docker-сети для взаимодействия микросервисов.                       |

</details>

----

<details>
<summary><strong>Инфраструктурные команды</strong></summary>

| Команда                                          | Makefile cmd    | Описание                                           |
|:-------------------------------------------------|:----------------|:---------------------------------------------------|
| `[ -f .env.example ] && cp -f .env.example .env` | `make env`      | Генерация `.env` из примера (если файла нет).      |
| `docker-compose up -d`                           | `make up`       | Запуск всех сервисов в фоновом режиме.             |
| `docker-compose stop`                            | `make stop`     | Остановка контейнеров без их удаления.             |
| `docker-compose down`                            | `make down`     | Остановка и полное удаление контейнеров и сетей.   |
| `docker-compose down && docker-compose up -d`    | `make restart`  | Перезапуск всей инфраструктуры.                    |
| `docker-compose down -v`                         | `make clean`    | Удаление контейнеров вместе с томами (очистка БД). |
| `docker-compose build`                           | `make build`    | Сборка Docker-образов приложения.                  |
| `docker-compose logs -f service`                 | `make logs`     | Логи основного сервиса в реальном времени.         |
| `docker-compose logs -f`                         | `make logs-all` | Объединенные логи всех сервисов.                   |
| `docker-compose ps`                              | `make ps`       | Просмотр статуса запущенных контейнеров.           |
| `docker system prune -f`                         | `make prune`    | Глобальная очистка неиспользуемых ресурсов Docker. |

</details>

----

<details>
<summary><strong>Команды для разработки</strong></summary>

| Команда                          | Описание                                                          |
|:---------------------------------|:------------------------------------------------------------------|
| `npm run lint`                   | Запуск проверки кода через ESLint.                                |
| `npm run lint:fix`               | Авто-исправление форматирования с логированием измененных файлов. |
| `npm run build`                  | Компиляция проекта в `dist`.                                      |
| `npm run start`                  | Запуск скомпилированного приложения.                              |
| `npm run start:dev`              | Запуск в режиме разработки с hot-reload *(watch mode)*.           |
| `npm run start:prod`             | Запуск из `dist/index.js` *(production mode)*.                    |
| `npx mikro-orm migration:create` | Генерация новой миграции на основе изменений в Entity.            |
| `npx mikro-orm migration:up`     | Применение всех миграций к базе данных.                           |

</details>

----

<details>
<summary><strong>Настройка окружения</strong></summary>

> Для корректной работы приложения требуется `Node.js v22.17.0` и `npm v11.6.2`;
> использование любых других версий не поддерживается.

Для разработки рекомендуется использовать [VSCode](https://code.visualstudio.com/).

#### Настройка VSCode
Для корректной работы [ESLint](https://eslint.org/docs/latest/), [Prettier](https://prettier.io/docs/en/) и [EditorConfig](https://editorconfig.org/) необходимо установить следующие расширения:
1. `dbaeumer.vscode-eslint`
2. `rvest.vs-code-prettier-eslint`
3. `esbenp.prettier-vscode`
4. `EditorConfig.EditorConfig`

</details>

----

<details>
<summary><strong>Правила работы с Git</strong></summary>

*Подключение git хуков:*
```sh
chmod +x .githooks/*
git config core.hooksPath .githooks
```

#### Доступные префиксы для коммитов и веток:
`feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

#### Формат сообщений коммитов:
```text
<type>(<scope>)?[!]: <subject>
```

*Где:*
 - `<type>`    — один из допустимых префиксов выше.
 - `<scope>`   — опциональный scope в скобках, латиница/цифры/`-`.
 - `!`         — опциональный маркер breaking changes.
 - `: `        — двоеточие + пробел обязательны.
 - `<subject>` — короткое описание (от 1 до 50 символов).

*Примеры валидных коммитов:*
 - `feat: add filters to user search`
 - `fix(auth): handle invalid jwt token`
 - `refactor(user-service)!: drop legacy ws implementation`
 - `docs: update api usage section`
 - `chore(ci): tweak lint step`

#### Формат названий веток:
```text
<type>/<slug>
<type>/<scope-or-id>/<slug>
```

Где:
 - `<type>`         — один из префиксов из пункта 1.
 - `/<scope-or-id>` - опциональная часть, латиница/цифры/`-`.
 - `/<slug>`        - короткое описание (от 1 до 50 символов), латиница/цифры/`_`/`-`.

Примеры валидных веток:
 - `feat/add-user-search-filters`
 - `fix/schedule-update-ws-event`
 - `refactor/core-user-cleanup`
 - `feat/GOTEC-404/add-notifications-for-users`

> Исключения: `dev`, `main`, `master`.

</details>

----
