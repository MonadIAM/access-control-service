# @monadiam/access-control-service

Language: [EN](README.md) | **RU**

IAM | Управление доступом и авторизация: иерархический RBAC, переопределение разрешений DAC, разделение обязанностей (SoD), политики делегирования ролей и изоляция доступа по realm.

----

<details>
<summary><strong>Локальный запуск</strong></summary>

1. Сначала запустите инфраструктуру из репозитория [infrastructure](https://github.com/MonadIAM/infrastructure/tree/local), ветка `local`.

2. Запустите [identity-service](https://github.com/MonadIAM/identity-service),
если требуется проверка JWT через JWKS.

3. Создайте локальный файл окружения:
```sh
make env
```

4. Соберите и запустите сервис:
```sh
make build
make up
```

Адреса зависимостей внутри сети Docker:

| Зависимость   | Адрес внутри сети Docker         |
| :------------ | :------------------------------- |
| PostgreSQL    | `access-control-postgresql:5432` |
| Redis         | `access-control-redis:6379`      |
| Kafka         | `kafka:29092`                    |
| Vault         | `vault:8200`                     |
| Identity JWKS | `identity-service-app:4002`      |

Общие сети Docker создаются инфраструктурой:
`postgres-net`, `redis-net`, `kafka-net` и `vault-net`.

</details>

----

<details>
<summary><strong>Локальные порты</strong></summary>

| Ресурс     | Порт                                  |
| :--------- | :------------------------------------ |
| HTTP API   | `4001`                                |
| gRPC       | `50051` внутри контейнера сервиса     |
| PostgreSQL | `6001` на хосте, `5432` внутри Docker |
| Redis      | `7001` на хосте, `6379` внутри Docker |

</details>

----

<details>
<summary><strong>Команды проекта</strong></summary>

| Makefile                                | Описание                                                                       |
| :-------------------------------------- | :----------------------------------------------------------------------------- |
| **Инфраструктура**                      |                                                                                |
| `make env`                              | Создать `.env` из `.env.local.example`.                                        |
| `make build`                            | Собрать локальный образ Compose.                                               |
| `make up`                               | Запустить сервис, инициализацию Vault и Vault Agent.                           |
| `make down`                             | Остановить и удалить контейнеры сервиса.                                       |
| `make restart`                          | Выполнить `make down` и `make up`.                                             |
| **Разработка**                          |                                                                                |
| `make lint`                             | Проверить код через ESLint.                                                    |
| `make lint-fix`                         | Исправить только нарушения Prettier и вывести пути изменённых файлов.          |
| `make tsc`                              | Проверить типы TypeScript без сборки (`tsc --noEmit`).                         |
| `make knip`                             | Найти неиспользуемые экспорты, файлы и зависимости.                            |
| `make secrets-check`                    | Проверить подготовленные к коммиту изменения на секреты через Gitleaks.        |
| `make env-check`                        | Проверить согласованность DTO, env-шаблонов и переменных конфигурации.         |
| `make intl-types`                       | Сгенерировать типы TypeScript из словарей переводов.                           |
| `make intl-check`                       | Выполнить все шесть проверок словарей из Git-хука.                             |
| **База данных**                         |                                                                                |
| `make migrate`                          | Применить новые миграции MikroORM в работающем контейнере сервиса.             |
| `make migration name="..."`             | Создать миграцию MikroORM в работающем контейнере сервиса.                     |
| `make empty-migration name="..."`       | Создать пустую миграцию MikroORM.                                              |
| `make seed-postgresql`                  | Заменить датасет PostgreSQL.                                                   |
| `make seed-redis`                       | Заменить проекции Redis.                                                       |
| `make seed`                             | Выполнить сидирование PostgreSQL, затем проекций Redis.                        |
| **Тестирование**                        |                                                                                |
| `make test`                             | Запустить модульные и интеграционные тесты (требуется Docker).                 |
| `make utest`                            | Запустить модульные тесты.                                                     |
| `make itest`                            | Запустить интеграционные тесты (требуется Docker).                             |
| `make coverage-unit`                    | Запустить модульные тесты с покрытием в `coverage/unit`.                       |
| `make coverage-integration`             | Запустить интеграционные тесты с покрытием в `coverage/integration`.           |
| `make coverage`                         | Запустить оба набора тестов с общим покрытием в `coverage/all`.                |
| **Контейнер / GHCR (системные)**        |                                                                                |
| `make image`                            | Собрать образ сервиса; доступно вручную с `IMAGE`, `BASE_IMAGE`, `VCS_REF`.    |
| `make image-publish`                    | Опубликовать образ с SHA коммита (GitHub Actions).                             |
| `make image-release`                    | Добавить опубликованному SHA-образу тег версии пакета (GitHub Actions).        |
| `make image-cleanup`                    | Оставить последние 10 промежуточных SHA-образов и все релизы (GitHub Actions). |
| **LLM-инструменты (экспериментальные)** |                                                                                |
| `make lsp`                              | Запустить MCP-сервер для навигации по TypeScript через stdio.                  |
| `make graphify`                         | Создать или обновить локальный граф кода и отчёт Markdown.                     |
| `make graphify-rebuild`                 | Пересоздать граф кода и отчёт с полным сканированием проекта.                  |
| `make graphify-html`                    | Обновить граф и отчёт, затем экспортировать визуализацию HTML.                 |

</details>

----

<details>
<summary><strong>Конфигурация стенда</strong></summary>

Настройки приложения: [.env.stand.example](.env.stand.example). На стенде Kubernetes передаёт
переменные окружения и монтирует Secrets; параметры Compose не используются.

| Подключение | Режим на стенде                        | Монтируемые файлы / учётные данные                             |
| :---------- | :------------------------------------- | :------------------------------------------------------------- |
| PostgreSQL  | CNPG `rw` / `ro`, TLS, пароль          | `/tls/postgresql/ca.crt`; `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| Redis       | Sentinel, поиск текущего мастера, mTLS | `/tls/redis/{ca.crt,tls.crt,tls.key}`; `REDIS_PASSWORD`        |
| Kafka       | TLS + SCRAM-SHA-512                    | `/tls/kafka/ca.crt`; `/secrets/kafka/password`                 |
| Vault       | Transit через Unix-сокет Vault Agent   | `/vault/proxy/agent.sock`, общий с контейнером Vault Agent     |

**Миграции и сидирование**

```sh
kubectl exec -n monadiam-apps <pod> -c service -- make migrate
kubectl exec -n monadiam-apps <pod> -c service -- make seed
```

</details>

----

<details>
<summary><strong>Пакет контейнера (GHCR)</strong></summary>

`ghcr.io/monadiam/access-control-service`

| Событие       | Действие                                                                                                            |
| :------------ | :------------------------------------------------------------------------------------------------------------------ |
| PR в `dev`    | Проверки и сборка образа сервиса без публикации                                                                     |
| Push в `dev`  | Сборка коммита после слияния PR и публикация `sha-<commit>`                                                         |
| Тег `vX.Y.Z`  | Проверка версии в `package.json` и наличия коммита в `dev`; добавление тега `X.Y.Z` к его SHA-образу без пересборки |
| Очистка       | Хранение 10 промежуточных SHA-версий и всех релизов                                                                 |
| Стенд         | Фиксация digest релизного образа                                                                                    |

[CI](.github/workflows/ci.yml), [публикация](.github/workflows/publish.yml), 
[релиз](.github/workflows/release.yml), [операции над пакетом](.github/scripts/packages.sh).

Стадии [Dockerfile](docker/app/Dockerfile):

| Стадия        | Назначение                                                                                             |
| :------------ | :----------------------------------------------------------------------------------------------------- |
| `development` | Локальный запуск через Compose и работа с миграциями                                                   |
| `runner`      | Образ для GHCR: production-зависимости, собранный код, TypeScript для CLI и пользователь без прав root |

В обеих стадиях доступны `make`, `pnpm` и `tsx`. Версия `pnpm` закреплена и кешируется
при сборке. Команды БД запускаются внутри контейнера. Makefile на хосте вызывает их
через Compose. При старте контейнера запускается только сервис.

</details>

----
