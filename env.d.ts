declare namespace NodeJS {
    interface ProcessEnv {
        // ---------------------------------------------------------------------------
        // App
        // ---------------------------------------------------------------------------

        SERVICE_NAME: string;
        NODE_ENV: "development" | "production" | "test";

        APP_BASE_IMAGE: string;
        APP_HOST: string;
        APP_PORT: `${number}`;
        THROTTLE_LIMIT: `${number}`;
        THROTTLE_TTL: `${number}`;

        // ---------------------------------------------------------------------------
        // PostgreSQL - common
        // ---------------------------------------------------------------------------

        POSTGRESQL_IMAGE: string;
        POSTGRESQL_PORT: `${number}`;
        POSTGRESQL_REPLICA_PORT: `${number}`;
        POSTGRESQL_USER: string;
        POSTGRESQL_PASS: string;
        POSTGRESQL_NAME: string;
        POSTGRESQL_SSL: "true" | "false";
        POSTGRESQL_SSL_REJECT_UNAUTHORIZED: "true" | "false";
        POSTGRESQL_POOL_IDLE_MS: `${number}`;
        POSTGRESQL_POOL_MAX: `${number}`;
        POSTGRESQL_LOGGING: "true" | "false";
        POSTGRESQL_CQRS_ENABLED: "true" | "false";
        POSTGRESQL_HOST: string;

        // ---------------------------------------------------------------------------
        // PostgreSQL - write-side
        // ---------------------------------------------------------------------------

        POSTGRESQL_WRITE_HOST: string;
        POSTGRESQL_WRITE_PORT: `${number}`;
        POSTGRESQL_WRITE_POOL_MAX: `${number}`;
        POSTGRESQL_WRITE_POOL_IDLE_MS: `${number}`;

        // ---------------------------------------------------------------------------
        // PostgreSQL - read-side
        // ---------------------------------------------------------------------------

        POSTGRESQL_READ_HOST: string;
        POSTGRESQL_READ_PORT: `${number}`;
        POSTGRESQL_READ_POOL_MAX: `${number}`;
        POSTGRESQL_READ_POOL_IDLE_MS: `${number}`;

        // ---------------------------------------------------------------------------
        // PostgreSQL - replication
        // ---------------------------------------------------------------------------

        POSTGRESQL_REPLICATION_USER: string;
        POSTGRESQL_REPLICATION_PASSWORD: string;
        POSTGRESQL_REPLICATION_SLOT: string;

        // ---------------------------------------------------------------------------
        // Redis
        // ---------------------------------------------------------------------------

        REDIS_IMAGE: string;
        REDIS_HOST: string;
        REDIS_PORT: `${number}`;
        REDIS_PASSWORD: string;
        REDIS_DB_CACHE: `${number}`;
        REDIS_DB_LIMITER: `${number}`;
        REDIS_DB_QUEUE: `${number}`;

        // ---------------------------------------------------------------------------
        // Kafka
        // ---------------------------------------------------------------------------

        KAFKA_BROKER: string;
        KAFKA_RETRY_ATTEMPTS: `${number}`;
        KAFKA_RETRY_INITIAL_TIME: `${number}`;
        DOCKER_NETWORK_NAME: string;

        // ---------------------------------------------------------------------------
        // Domain-specific limits
        // ---------------------------------------------------------------------------

        MAX_ROLE_SUBTREE_SIZE_FOR_PURGE: `${number}`;
        MAX_CONFLECT_MEMBERS_COUNT: `${number}`;
        PERMISSION_LIMIT: `${number}`;
        ROLE_LIMIT: `${number}`;
    }
}
