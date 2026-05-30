{
    "name": "outbox-connector",
    "config": {
        "connector.class": "io.debezium.connector.postgresql.PostgresConnector",

        "database.hostname": "postgresql-primary",
        "database.port": "${POSTGRES_PORT}",
        "database.user": "${POSTGRES_USER}",
        "database.password": "${POSTGRES_PASSWORD}",
        "database.dbname": "${POSTGRES_DB}",
        "topic.prefix": "${SERVICE_NAME}-outbox",

        "schema.include.list": "system",
        "table.include.list": "system\\.outbox",

        "plugin.name": "pgoutput",
        "slot.name": "outbox_slot",
        "publication.name": "outbox_publication",
        "publication.autocreate.mode": "filtered",
        "snapshot.mode": "no_data",

        "value.converter": "org.apache.kafka.connect.json.JsonConverter",
        "value.converter.schemas.enable": "false",
        "key.converter": "org.apache.kafka.connect.json.JsonConverter",
        "key.converter.schemas.enable": "false",

        "transforms": "unwrap,rename,route",

        "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
        "transforms.unwrap.drop.tombstones": "true",
        "transforms.unwrap.delete.handling.mode": "drop",

        "transforms.rename.type": "org.apache.kafka.connect.transforms.ReplaceField$Value",
        "transforms.rename.renames": "sequence_number:sequenceNumber,event_type:eventType,aggregate_type:aggregateType,destination_topic:destinationTopic,created_at:createdAt",

        "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
        "transforms.route.regex": ".*",
        "transforms.route.replacement": "outbox"
    }
}
