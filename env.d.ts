declare namespace NodeJS {
    interface ProcessEnv {
        SERVICE_NAME: string;
        NODE_ENV: "development" | "production";
        APP_BASE_IMAGE: string;
        APP_HOST: string;
        APP_PORT: string;

        POSTGRESQL_IMAGE: string;
        POSTGRESQL_HOST: string;
        POSTGRESQL_PORT: string;
        POSTGRESQL_USER: string;
        POSTGRESQL_PASS: string;
        POSTGRESQL_NAME: string;
        POSTGRESQL_SSL: string;
        POSTGRESQL_SSL_REJECT_UNAUTHORIZED: string;

        REDIS_IMAGE: string;
        REDIS_HOST: string;
        REDIS_PORT: string;
        REDIS_PASSWORD: string;

        KAFKA_BROKER: string;
        KAFKA_RETRY_ATTEMPTS: string;
        KAFKA_RETRY_INITIAL_TIME: string;
        DOCKER_NETWORK_NAME: string;
    }
}

