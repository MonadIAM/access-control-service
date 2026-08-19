service {
    name    = "access-control-service"
    id      = "access-control-service"
    address = "access-control-service-connect"
    port    = 50051

    connect {
        sidecar_service {
            address = "access-control-service-connect"
            port    = 21051

            proxy {
                local_service_address = "127.0.0.1"
                local_service_port    = 50051

                config {
                    bind_address = "0.0.0.0"
                    bind_port    = 21051
                }
            }
        }
    }
}
