declare namespace NodeJS {
    interface ProcessEnv {
        SERVICE_NAME: string;
        NODE_ENV: "development" | "production";
        APP_BASE_IMAGE: string;
        APP_HOST: string;
        APP_PORT: `${number}`;

        POSTGRESQL_IMAGE: string;
        POSTGRESQL_HOST: string;
        POSTGRESQL_PORT: `${number}`;
        POSTGRESQL_USER: string;
        POSTGRESQL_PASS: string;
        POSTGRESQL_NAME: string;
        POSTGRESQL_SSL: "true" | "false";
        POSTGRESQL_SSL_REJECT_UNAUTHORIZED: "true" | "false";
        POSTGRESQL_POOL_IDLE_MS: `${number}`
        POSTGRESQL_POOL_MAX: `${number}`
        POSTGRESQL_LOGGING: "true" | "false";

        REDIS_IMAGE: string;
        REDIS_HOST: string;
        REDIS_PORT: `${number}`;
        REDIS_PASSWORD: string;
        REDIS_DB_CACHE: `${number}`;
        REDIS_DB_LIMITER: `${number}`;
        REDIS_DB_QUEUE: `${number}`;

        KAFKA_BROKER: string;
        KAFKA_RETRY_ATTEMPTS: `${number}`;
        KAFKA_RETRY_INITIAL_TIME: `${number}`;
        DOCKER_NETWORK_NAME: string;
    }
}

