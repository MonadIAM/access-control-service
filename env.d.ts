declare namespace NodeJS {
    interface ProcessEnv {
        // ---------------------------------------------------------------------------
        // App
        // ---------------------------------------------------------------------------

        SERVICE_NAME: string;
        NODE_ENV: "development" | "production" | "test";
        API_VERSION: `${number}`;

        APP_BASE_IMAGE: string;
        APP_HOST: string;
        APP_PORT: `${number}`;
        THROTTLE_LIMIT: `${number}`;
        THROTTLE_TTL: `${number}`;
        JWT_ISSUER: string;
        JWT_JWKS_URL: string;

        // ---------------------------------------------------------------------------
        // PostgreSQL - common
        // ---------------------------------------------------------------------------

        POSTGRES_IMAGE: string;
        POSTGRES_DB: string;
        POSTGRES_USER: string;
        POSTGRES_PASSWORD: string;
        POSTGRES_PORT: `${number}`;
        POSTGRES_REPLICA_PORT: `${number}`;
        POSTGRES_CONTAINER_PORT: `${number}`;
        POSTGRES_SSL: "true" | "false";
        POSTGRES_SSL_REJECT_UNAUTHORIZED: "true" | "false";
        POSTGRES_POOL_MAX: `${number}`;
        POSTGRES_POOL_IDLE_MS: `${number}`;
        POSTGRES_LOGGING: "true" | "false";
        POSTGRES_CQRS_ENABLED: "true" | "false";

        // ---------------------------------------------------------------------------
        // PostgreSQL - write
        // ---------------------------------------------------------------------------

        POSTGRES_HOST?: string;
        POSTGRES_WRITE_HOST?: string;
        POSTGRES_WRITE_PORT?: `${number}`;
        POSTGRES_WRITE_POOL_MAX: `${number}`;
        POSTGRES_WRITE_POOL_IDLE_MS: `${number}`;

        // ---------------------------------------------------------------------------
        // PostgreSQL - read
        // ---------------------------------------------------------------------------

        POSTGRES_READ_HOST?: string;
        POSTGRES_READ_PORT?: `${number}`;
        POSTGRES_READ_POOL_MAX: `${number}`;
        POSTGRES_READ_POOL_IDLE_MS: `${number}`;

        // ---------------------------------------------------------------------------
        // PostgreSQL - replication
        // ---------------------------------------------------------------------------

        POSTGRES_REPLICATION_USER: string;
        POSTGRES_REPLICATION_PASSWORD: string;
        POSTGRES_REPLICATION_SLOT: string;

        // ---------------------------------------------------------------------------
        // Redis
        // ---------------------------------------------------------------------------

        REDIS_IMAGE: string;
        REDIS_HOST?: string;
        REDIS_PORT: `${number}`;
        REDIS_CONTAINER_PORT: `${number}`;
        REDIS_PASSWORD: string;
        REDIS_DB_CACHE: `${number}`;
        REDIS_DB_LIMITER: `${number}`;
        REDIS_DB_QUEUE: `${number}`;

        // ---------------------------------------------------------------------------
        // Redis - services
        // ---------------------------------------------------------------------------

        PERMISSION_CACHE_TTL: `${number}`;

        // ---------------------------------------------------------------------------
        // Kafka
        // ---------------------------------------------------------------------------

        KAFKA_BROKER: string;
        KAFKA_RETRY_ATTEMPTS: `${number}`;
        KAFKA_RETRY_INITIAL_TIME: `${number}`;
        DOCKER_NETWORK_NAME: string;
        KAFKA_CONNECT_IMAGE: string;
        KAFKA_CONNECT_PORT: `${number}`;

        // ---------------------------------------------------------------------------
        // Debezium
        // ---------------------------------------------------------------------------

        DEBEZIUM_INIT_IMAGE: string;

        // ---------------------------------------------------------------------------
        // Domain-specific limits
        // ---------------------------------------------------------------------------

        REALM_LIMIT: `${number}`;
        ROLE_PER_REALM_LIMIT: `${number}`;
        ROLE_PER_ACCOUNT_LIMIT: `${number}`;
        PERMISSION_PER_REALM_LIMIT: `${number}`;
        PERMISSION_PER_ROLE_LIMIT: `${number}`;
        PERMISSION_OVERRIDE_PER_ACCOUNT_LIMIT: `${number}`;
        CONFLICT_GROUP_PER_REALM_LIMIT: `${number}`;
        MAX_CONFLICT_MEMBERS_COUNT: `${number}`;
        DELEGATION_POLICY_PER_ROLE_LIMIT: `${number}`;
        MAX_ROLE_SUBTREE_SIZE_FOR_PURGE: `${number}`;
        BULK_OPERATION_LIMIT: `${number}`;

        // ---------------------------------------------------------------------------
        // BullMQ
        // ---------------------------------------------------------------------------

        PERMISSION_CACHE_INVALIDATION_CHUNK_SIZE: `${number}`;
    }
}
