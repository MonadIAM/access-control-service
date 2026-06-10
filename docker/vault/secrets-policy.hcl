path "{{kv_mount}}/data/{{runtime_path}}" {
  capabilities = ["read"]
}

path "{{kv_mount}}/data/{{replication_path}}" {
  capabilities = ["read"]
}
