import { DiagLogLevel } from "@opentelemetry/api";
import { StringValue } from "ms";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // ---------------------------------------------------------------------------
            // App
            // ---------------------------------------------------------------------------

            SERVICE_NAME: string;
            NODE_ENV: "development" | "production" | "local";
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
            // Loki
            // ---------------------------------------------------------------------------

            LOKI_ENABLED: "true" | "false";
            LOKI_URL: string;
            LOKI_BATCH_INTERVAL: `${number}`;

            // ---------------------------------------------------------------------------
            // PostgreSQL - common
            // ---------------------------------------------------------------------------

            POSTGRES_DB: string;
            POSTGRES_USER: string;
            POSTGRES_PASSWORD: string;
            POSTGRES_SSL_ENABLED: "true" | "false";
            POSTGRES_SSL_REJECT_UNAUTHORIZED?: "true" | "false";
            POSTGRES_SSL_CA_FILE?: string;
            POSTGRES_SSL_CERT_FILE?: string;
            POSTGRES_SSL_KEY_FILE?: string;
            POSTGRES_POOL_MAX: `${number}`;
            POSTGRES_POOL_IDLE_MS: StringValue;
            POSTGRES_LOGGING: "true" | "false";
            POSTGRES_VAULT_CREDENTIALS_PATH?: string;

            // ---------------------------------------------------------------------------
            // PostgreSQL - write
            // ---------------------------------------------------------------------------

            POSTGRES_WRITE_POOL_MAX: `${number}`;
            POSTGRES_WRITE_POOL_IDLE_MS: StringValue;
            POSTGRES_WRITE_HOST: string;
            POSTGRES_WRITE_PORT: `${number}`;

            // ---------------------------------------------------------------------------
            // PostgreSQL - read
            // ---------------------------------------------------------------------------

            POSTGRES_READ_POOL_MAX: `${number}`;
            POSTGRES_READ_POOL_IDLE_MS: StringValue;
            POSTGRES_READ_HOST: string;
            POSTGRES_READ_PORT: `${number}`;

            // ---------------------------------------------------------------------------
            // Redis
            // ---------------------------------------------------------------------------

            REDIS_HOST: string;
            REDIS_PORT: `${number}`;
            REDIS_PASSWORD: string;
            REDIS_VAULT_RUNTIME_PATH?: string;
            REDIS_TLS_ENABLED: "true" | "false";
            REDIS_TLS_REJECT_UNAUTHORIZED?: "true" | "false";
            REDIS_TLS_CA_FILE?: string;
            REDIS_TLS_CERT_FILE?: string;
            REDIS_TLS_KEY_FILE?: string;
            REDIS_DB_CACHE: `${number}`;
            REDIS_DB_LIMITER: `${number}`;
            REDIS_DB_QUEUE: `${number}`;

            // ---------------------------------------------------------------------------
            // Kafka
            // ---------------------------------------------------------------------------

            KAFKA_BROKER: string;
            KAFKA_SSL_ENABLED: "true" | "false";
            KAFKA_SASL_ENABLED: "true" | "false";
            KAFKA_SSL_REJECT_UNAUTHORIZED?: "true" | "false";
            KAFKA_SSL_CA_FILE?: string;
            KAFKA_SSL_CERT_FILE?: string;
            KAFKA_SSL_KEY_FILE?: string;
            KAFKA_SASL_USERNAME?: string;
            KAFKA_SASL_PASSWORD_FILE?: string;
            KAFKA_RETRY_ATTEMPTS: `${number}`;
            KAFKA_RETRY_INITIAL_TIME: StringValue;
            KAFKAJS_NO_PARTITIONER_WARNING: `${number}`;
            KAFKA_DLQ_MAX_RETRIES: `${number}`;
            KAFKA_DLQ_RETRY_BASE_DELAY: StringValue;
            KAFKA_DLQ_RETRY_JITTER: StringValue;

            // ---------------------------------------------------------------------------
            // Schema Registry
            // ---------------------------------------------------------------------------

            SCHEMA_REGISTRY_SYNC_SCOPE: SchemaRegistry.Scope;
            SCHEMA_REGISTRY_SYNC_MODE: SchemaRegistry.Mode;
            SCHEMA_REGISTRY_SYNC_ENABLED: "true" | "false";
            SCHEMA_REGISTRY_URL: string;

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
            DOCKER_NETWORK_MONITORING?: string;
            DOCKER_NETWORK_POSTGRES: string;
            DOCKER_NETWORK_REDIS: string;
            DOCKER_NETWORK_VAULT: string;
            DOCKER_VOLUME_VAULT_CA?: string;
            DOCKER_VOLUME_SERVICE_TLS?: string;

            // ---------------------------------------------------------------------------
            // Vault
            // ---------------------------------------------------------------------------

            VAULT_IMAGE: string;
            VAULT_PORT?: `${number}`;
            VAULT_ADDR?: string;
            VAULT_TOKEN?: string;
            VAULT_APPROLE_NAME: string;
            VAULT_KV_MOUNT: string;
            VAULT_KV_RUNTIME_PATH: string;

            // ---------------------------------------------------------------------------
            // Vault (bootstrap)
            // ---------------------------------------------------------------------------

            VAULT_PROVISIONER_TOKEN?: string;

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
