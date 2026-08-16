import { DiagLogLevel } from "@opentelemetry/api";
import { StringValue } from "ms";

declare global {
    namespace NodeJS {
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
            GRPC_HOST: string;
            GRPC_PORT: `${number}`;
            THROTTLE_LIMIT: `${number}`;
            THROTTLE_TTL: StringValue;
            HSTS_MAX_AGE: StringValue;
            BODY_LIMIT_BYTES: `${number}`;
            JWT_ISSUER: string;
            JWT_JWKS_URL: string;
            JWT_JWKS_COOLDOWN_DURATION: StringValue;
            JWT_JWKS_TIMEOUT_DURATION: StringValue;
            JWT_JWKS_CACHE_MAX_AGE: StringValue;
            IDENTITY_SERVICE_URL: string;
            ACCESS_CONTROL_SERVICE_URL: string;
            ALLOWED_SERVICE_ORIGINS: string;
            ALLOWED_UI_ORIGINS: string;

            // ---------------------------------------------------------------------------
            // OpenTelemetry
            // ---------------------------------------------------------------------------

            OTEL_EXPORTER_OTLP_ENDPOINT: string;
            OTEL_LOG_LEVEL: keyof typeof DiagLogLevel;
            OTEL_LOGS_EXPORTER: "none" | "otlp" | "console";

            // ---------------------------------------------------------------------------
            // PostgreSQL - common
            // ---------------------------------------------------------------------------

            POSTGRES_IMAGE: string;
            POSTGRES_DB: string;
            POSTGRES_USER: string;
            POSTGRES_PASSWORD: string;
            POSTGRES_HOST: string;
            POSTGRES_PORT: `${number}`;
            POSTGRES_PRIMARY_PUBLISHED_PORT: `${number}`;
            POSTGRES_REPLICA_PUBLISHED_PORT: `${number}`;
            POSTGRES_SSL: "true" | "false";
            POSTGRES_SSL_REJECT_UNAUTHORIZED: "true" | "false";
            POSTGRES_POOL_MAX: `${number}`;
            POSTGRES_POOL_IDLE_MS: StringValue;
            POSTGRES_LOGGING: "true" | "false";
            POSTGRES_CQRS_ENABLED: "true" | "false";

            // ---------------------------------------------------------------------------
            // PostgreSQL - write
            // ---------------------------------------------------------------------------

            POSTGRES_WRITE_POOL_MAX: `${number}`;
            POSTGRES_WRITE_POOL_IDLE_MS: StringValue;
            POSTGRES_WRITE_HOST: string;

            // ---------------------------------------------------------------------------
            // PostgreSQL - read
            // ---------------------------------------------------------------------------

            POSTGRES_READ_POOL_MAX: `${number}`;
            POSTGRES_READ_POOL_IDLE_MS: StringValue;
            POSTGRES_READ_HOST: string;

            // ---------------------------------------------------------------------------
            // PostgreSQL - replication
            // ---------------------------------------------------------------------------

            POSTGRES_REPLICATION_USER: string;
            POSTGRES_REPLICATION_SLOT: string;

            // ---------------------------------------------------------------------------
            // Redis
            // ---------------------------------------------------------------------------

            REDIS_IMAGE: string;
            REDIS_HOST: string;
            REDIS_PORT: `${number}`;
            REDIS_PUBLISHED_PORT: `${number}`;
            REDIS_PASSWORD: string;
            REDIS_DB_CACHE: `${number}`;
            REDIS_DB_LIMITER: `${number}`;
            REDIS_DB_QUEUE: `${number}`;

            // ---------------------------------------------------------------------------
            // Kafka
            // ---------------------------------------------------------------------------

            KAFKA_BROKER: string;
            KAFKA_RETRY_ATTEMPTS: `${number}`;
            KAFKA_RETRY_INITIAL_TIME: StringValue;
            KAFKA_CONNECT_IMAGE: string;
            KAFKA_CONNECT_PORT: `${number}`;
            KAFKAJS_NO_PARTITIONER_WARNING: `${number}`;
            KAFKA_DLQ_MAX_RETRIES: `${number}`;
            KAFKA_DLQ_RETRY_BASE_DELAY: StringValue;
            KAFKA_DLQ_RETRY_JITTER: StringValue;

            // ---------------------------------------------------------------------------
            // BullMQ - cleanup
            // ---------------------------------------------------------------------------

            AUDIT_LOG_RETENTION_TTL: StringValue;
            CHANGE_LOG_RETENTION_TTL: StringValue;
            CLEANUP_BATCH_SIZE: `${number}`;
            CLEANUP_BATCH_DELAY: StringValue;
            CLEANUP_BATCH_BACKOFF_DELAY: StringValue;
            CLEANUP_BATCH_ATTEMPTS: `${number}`;

            // ---------------------------------------------------------------------------
            // Network
            // ---------------------------------------------------------------------------

            DOCKER_NETWORK_KAFKA: string;
            DOCKER_NETWORK_MONITORING: string;
            DOCKER_NETWORK_VAULT: string;

            // ---------------------------------------------------------------------------
            // Debezium
            // ---------------------------------------------------------------------------

            DEBEZIUM_INIT_IMAGE: string;

            // ---------------------------------------------------------------------------
            // Vault
            // ---------------------------------------------------------------------------

            VAULT_IMAGE: string;
            VAULT_PORT: `${number}`;
            VAULT_APPROLE_NAME: string;
            VAULT_KV_MOUNT: string;
            VAULT_KV_RUNTIME_PATH: string;
            VAULT_KV_REPLICATION_PATH: string;

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
        }
    }
}
