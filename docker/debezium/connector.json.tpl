{
  "name": "outbox-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgresql-primary",
    "database.port": "${POSTGRES_CONTAINER_PORT}",
    "database.user": "${POSTGRES_USER}",
    "database.password": "${POSTGRES_PASSWORD}",
    "database.dbname": "${POSTGRES_DB}",
    "topic.prefix": "${SERVICE_NAME}",
    "schema.include.list": "system",
    "table.include.list": "system.outbox",
    "plugin.name": "pgoutput",
    "slot.name": "outbox_slot",
    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
    "transforms.outbox.table.field.event.type": "event_type",
    "transforms.outbox.route.topic.replacement": "{{routedByValue}}",
    "transforms.outbox.table.field.event.key": "id"
  }
}
