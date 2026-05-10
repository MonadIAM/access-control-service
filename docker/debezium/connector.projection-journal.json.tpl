{
  "name": "projection-journal-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgresql-primary",
    "database.port": "${POSTGRES_CONTAINER_PORT}",
    "database.user": "${POSTGRES_USER}",
    "database.password": "${POSTGRES_PASSWORD}",
    "database.dbname": "${POSTGRES_DB}",
    "topic.prefix": "${SERVICE_NAME}-projection",
    "schema.include.list": "system",
    "table.include.list": "system.projection_journal",
    "plugin.name": "pgoutput",
    "slot.name": "projection_journal_slot",
    "publication.name": "projection_journal_publication",
    "snapshot.mode": "never",

    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter.schemas.enable": "false",
    "key.converter": "org.apache.kafka.connect.json.JsonConverter",
    "key.converter.schemas.enable": "false",

    "transforms": "route,unwrap",

    "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
    "transforms.route.regex": ".*",
    "transforms.route.replacement": "projection-journal",

    "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
    "transforms.unwrap.drop.tombstones": "true",
    "transforms.unwrap.delete.handling.mode": "drop",
    "transforms.unwrap.add.fields": ""
  }
}
