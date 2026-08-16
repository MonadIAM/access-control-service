pid_file = "/tmp/pidfile"

auto_auth {
    method "approle" {
        mount_path = "auth/approle"

        config = {
            role_id_file_path                   = "/vault/config/role-id"
            secret_id_file_path                 = "/vault/agent-bootstrap/secret-id"
            remove_secret_id_file_after_reading = true
        }
    }

    sink "file" {
        config = {
            path = "/vault/token/agent-token"
        }
    }
}

template {
    contents    = "{{ with secret \"kv/data/access-control-service/runtime\" }}{{ .Data.data.redis_password }}{{ end }}"
    destination = "/secrets/redis/redis_password"
    perms       = "0440"
}

template {
    contents    = "{{ with secret \"kv/data/access-control-service/postgresql-replication\" }}{{ .Data.data.postgresql_replication_password }}{{ end }}"
    destination = "/secrets/postgresql/postgresql_replication_password"
    perms       = "0440"
}

template {
    contents    = "{{ with secret \"kv/data/access-control-service/runtime\" }}{{ .Data.data.postgresql_password }}{{ end }}"
    destination = "/secrets/postgresql/postgresql_password"
    perms       = "0440"
}

template {
    contents    = "{{ with secret \"database/creds/access-control-service-app\" }}{{ .Data.username }}{{ end }}"
    destination = "/secrets/application/postgresql_username"
    perms       = "0440"
}

template {
    contents    = "{{ with secret \"database/creds/access-control-service-app\" }}{{ .Data.password }}{{ end }}"
    destination = "/secrets/application/postgresql_password"
    perms       = "0440"
}

template {
    contents    = "{{ with secret \"kv/data/access-control-service/runtime\" }}{{ .Data.data.redis_password }}{{ end }}"
    destination = "/secrets/application/redis_password"
    perms       = "0440"
}

template {
    contents    = "{{ with secret \"kv/data/access-control-service/runtime\" }}{{ .Data.data.postgresql_password }}{{ end }}"
    destination = "/secrets/debezium/postgresql_password"
    perms       = "0440"
}
