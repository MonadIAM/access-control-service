import { DiagLogLevel } from "@opentelemetry/api";
import { ValidateIf } from "class-validator";
import { type StringValue } from "ms";

import { Validator } from "~common/validator";
import { NodeEnv } from "~common/enums";

export class EnvironmentVariablesDTO {
    // ---------------------------------------------------------------------------
    // App
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public SERVICE_NAME: string;

    @Validator.IsEnum(NodeEnv)
    declare public NODE_ENV: NodeEnv;

    @Validator.IsPositiveInt()
    declare public API_VERSION: number;

    @Validator.IsString()
    declare public APP_BASE_IMAGE: string;

    @Validator.IsString()
    declare public APP_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public APP_PORT: number;

    @Validator.IsString()
    declare public GRPC_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public GRPC_PORT: number;

    @Validator.IsPositiveInt()
    declare public THROTTLE_LIMIT: number;

    @Validator.IsMsString()
    declare public THROTTLE_TTL: StringValue;

    @Validator.IsMsString()
    declare public HSTS_MAX_AGE: StringValue;

    @Validator.IsPositiveInt()
    declare public BODY_LIMIT_BYTES: number;

    @Validator.IsString()
    declare public JWT_ISSUER: string;

    @Validator.IsString()
    declare public JWT_JWKS_URL: string;

    @Validator.IsString()
    declare public JWT_JWKS_COOLDOWN_DURATION: StringValue;

    @Validator.IsString()
    declare public JWT_JWKS_TIMEOUT_DURATION: StringValue;

    @Validator.IsString()
    declare public JWT_JWKS_CACHE_MAX_AGE: StringValue;

    @Validator.IsString()
    declare public IDENTITY_SERVICE_URL: string;

    @Validator.IsString()
    declare public ACCESS_CONTROL_SERVICE_URL: string;

    @Validator.IsString()
    declare public ALLOWED_SERVICE_ORIGINS: string;

    @Validator.IsString()
    declare public ALLOWED_UI_ORIGINS: string;

    // ---------------------------------------------------------------------------
    // OpenTelemetry
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public OTEL_EXPORTER_OTLP_ENDPOINT: string;

    @Validator.IsIn(Object.keys(DiagLogLevel))
    declare public OTEL_LOG_LEVEL: keyof typeof DiagLogLevel;

    @Validator.IsIn(["none", "otlp", "console"])
    declare public OTEL_LOGS_EXPORTER: "none" | "otlp" | "console";

    // ---------------------------------------------------------------------------
    // Loki
    // ---------------------------------------------------------------------------

    @Validator.IsBoolean()
    declare public LOKI_ENABLED: boolean;

    @Validator.IsString()
    declare public LOKI_URL: string;

    @Validator.IsPositiveInt()
    declare public LOKI_BATCH_INTERVAL: number;

    // ---------------------------------------------------------------------------
    // PostgreSQL - common
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_DB: string;

    @Validator.IsString()
    declare public POSTGRES_USER: string;

    @Validator.IsString()
    declare public POSTGRES_PASSWORD: string;

    @Validator.IsBoolean()
    declare public POSTGRES_SSL_ENABLED: boolean;

    @Validator.IsBoolean()
    @ValidateIf((o) => o.POSTGRES_SSL_ENABLED)
    declare public POSTGRES_SSL_REJECT_UNAUTHORIZED?: boolean;

    @Validator.IsString()
    @ValidateIf((o) => o.POSTGRES_SSL_ENABLED)
    declare public POSTGRES_SSL_CA_FILE?: string;

    @Validator.IsString()
    @ValidateIf((o) => o.POSTGRES_SSL_ENABLED)
    declare public POSTGRES_SSL_CERT_FILE?: string;

    @Validator.IsString()
    @ValidateIf((o) => o.POSTGRES_SSL_ENABLED)
    declare public POSTGRES_SSL_KEY_FILE?: string;

    @Validator.IsPositiveInt()
    declare public POSTGRES_POOL_MAX: number;

    @Validator.IsMsString()
    declare public POSTGRES_POOL_IDLE_MS: StringValue;

    @Validator.IsBoolean()
    declare public POSTGRES_LOGGING: boolean;

    @Validator.IsString()
    @ValidateIf((o) => o.NODE_ENV === NodeEnv.LOCAL)
    declare public POSTGRES_VAULT_CREDENTIALS_PATH?: string;

    // ---------------------------------------------------------------------------
    // PostgreSQL - write
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_WRITE_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_WRITE_PORT: number;

    @Validator.IsPositiveInt()
    declare public POSTGRES_WRITE_POOL_MAX: number;

    @Validator.IsMsString()
    declare public POSTGRES_WRITE_POOL_IDLE_MS: StringValue;

    // ---------------------------------------------------------------------------
    // PostgreSQL - read
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_READ_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_READ_PORT: number;

    @Validator.IsPositiveInt()
    declare public POSTGRES_READ_POOL_MAX: number;

    @Validator.IsMsString()
    declare public POSTGRES_READ_POOL_IDLE_MS: StringValue;

    // ---------------------------------------------------------------------------
    // Redis
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public REDIS_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public REDIS_PORT: number;

    @Validator.IsString()
    declare public REDIS_PASSWORD: string;

    @Validator.IsString()
    @ValidateIf((o) => o.NODE_ENV === NodeEnv.LOCAL)
    declare public REDIS_VAULT_RUNTIME_PATH?: string;

    @Validator.IsBoolean()
    declare public REDIS_TLS_ENABLED: boolean;

    @Validator.IsBoolean()
    @ValidateIf((o) => o.REDIS_TLS_ENABLED)
    declare public REDIS_TLS_REJECT_UNAUTHORIZED?: boolean;

    @Validator.IsString()
    @ValidateIf((o) => o.REDIS_TLS_ENABLED)
    declare public REDIS_TLS_CA_FILE?: string;

    @Validator.IsString()
    @ValidateIf((o) => o.REDIS_TLS_ENABLED)
    declare public REDIS_TLS_CERT_FILE?: string;

    @Validator.IsString()
    @ValidateIf((o) => o.REDIS_TLS_ENABLED)
    declare public REDIS_TLS_KEY_FILE?: string;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public REDIS_DB_CACHE: number;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public REDIS_DB_LIMITER: number;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public REDIS_DB_QUEUE: number;

    // ---------------------------------------------------------------------------
    // Kafka
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public KAFKA_BROKER: string;

    @Validator.IsBoolean()
    declare public KAFKA_SSL_ENABLED: boolean;

    @Validator.IsBoolean()
    declare public KAFKA_SASL_ENABLED: boolean;

    @Validator.IsBoolean()
    @ValidateIf((o) => o.KAFKA_SSL_ENABLED)
    declare public KAFKA_SSL_REJECT_UNAUTHORIZED?: boolean;

    @Validator.IsString()
    @ValidateIf((o) => o.KAFKA_SSL_ENABLED)
    declare public KAFKA_SSL_CA_FILE?: string;

    @Validator.IsString()
    @ValidateIf((o) => o.KAFKA_SSL_ENABLED)
    declare public KAFKA_SSL_CERT_FILE?: string;

    @Validator.IsString()
    @ValidateIf((o) => o.KAFKA_SSL_ENABLED)
    declare public KAFKA_SSL_KEY_FILE?: string;

    @Validator.IsString()
    @ValidateIf((o) => o.KAFKA_SASL_ENABLED)
    declare public KAFKA_SASL_USERNAME?: string;

    @Validator.IsString()
    @ValidateIf((o) => o.KAFKA_SASL_ENABLED)
    declare public KAFKA_SASL_PASSWORD_FILE?: string;

    @Validator.IsPositiveInt()
    declare public KAFKA_RETRY_ATTEMPTS: number;

    @Validator.IsMsString()
    declare public KAFKA_RETRY_INITIAL_TIME: StringValue;

    @Validator.IsInt()
    declare public KAFKAJS_NO_PARTITIONER_WARNING: number;

    @Validator.IsInt()
    declare public KAFKA_DLQ_MAX_RETRIES: number;

    @Validator.IsMsString()
    declare public KAFKA_DLQ_RETRY_BASE_DELAY: StringValue;

    @Validator.IsMsString()
    declare public KAFKA_DLQ_RETRY_JITTER: StringValue;

    // ---------------------------------------------------------------------------
    // Schema Registry
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public SCHEMA_REGISTRY_URL: string;

    @Validator.IsBoolean()
    declare public SCHEMA_REGISTRY_ENABLED: boolean;

    // ---------------------------------------------------------------------------
    // BullMQ - cleanup
    // ---------------------------------------------------------------------------

    @Validator.IsMsString()
    declare public AUDIT_LOG_RETENTION_TTL: StringValue;

    @Validator.IsMsString()
    declare public CHANGE_LOG_RETENTION_TTL: StringValue;

    @Validator.IsPositiveInt()
    declare public CLEANUP_BATCH_SIZE: number;

    @Validator.IsMsString()
    declare public CLEANUP_BATCH_DELAY: StringValue;

    @Validator.IsMsString()
    declare public CLEANUP_BATCH_BACKOFF_DELAY: StringValue;

    @Validator.IsPositiveInt()
    declare public CLEANUP_BATCH_ATTEMPTS: number;

    // ---------------------------------------------------------------------------
    // Network
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    @ValidateIf((o) => o.NODE_ENV !== NodeEnv.LOCAL)
    declare public DOCKER_NETWORK_MONITORING?: string;

    @Validator.IsString()
    declare public DOCKER_NETWORK_KAFKA: string;

    @Validator.IsString()
    declare public DOCKER_NETWORK_POSTGRES: string;

    @Validator.IsString()
    declare public DOCKER_NETWORK_REDIS: string;

    @Validator.IsString()
    declare public DOCKER_NETWORK_VAULT: string;

    @Validator.IsString()
    @ValidateIf((o) => o.NODE_ENV !== NodeEnv.LOCAL)
    declare public DOCKER_VOLUME_VAULT_CA?: string;

    @Validator.IsString()
    @ValidateIf((o) => o.NODE_ENV !== NodeEnv.LOCAL)
    declare public DOCKER_VOLUME_SERVICE_TLS?: string;

    // ---------------------------------------------------------------------------
    // Vault
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public VAULT_IMAGE: string;

    @Validator.IsString()
    declare public VAULT_AGENT_SOCKET_PATH: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    @ValidateIf((o) => o.NODE_ENV !== NodeEnv.LOCAL)
    declare public VAULT_PORT?: number;

    @Validator.IsString()
    @ValidateIf((o) => o.NODE_ENV === NodeEnv.LOCAL)
    declare public VAULT_ADDR?: string;

    @Validator.IsString()
    @ValidateIf((o) => o.NODE_ENV === NodeEnv.LOCAL)
    declare public VAULT_TOKEN?: string;

    @Validator.IsString()
    declare public VAULT_APPROLE_NAME: string;

    @Validator.IsString()
    declare public VAULT_TRANSIT_MOUNT: string;

    @Validator.IsString()
    declare public VAULT_TRANSIT_AUDIT_MASK_KEY: string;

    @Validator.IsString()
    declare public VAULT_TRANSIT_AUDIT_LOG_KEY: string;

    @Validator.IsString()
    declare public VAULT_KV_MOUNT: string;

    @Validator.IsString()
    declare public VAULT_KV_RUNTIME_PATH: string;

    // ---------------------------------------------------------------------------
    // Vault (bootstrap)
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    @ValidateIf((o) => o.NODE_ENV !== NodeEnv.LOCAL)
    declare public VAULT_PROVISIONER_TOKEN?: string;

    // ---------------------------------------------------------------------------
    // Domain-specific limits
    // ---------------------------------------------------------------------------

    @Validator.IsPositiveInt()
    declare public REALM_LIMIT: number;

    @Validator.IsPositiveInt()
    declare public ROLE_PER_REALM_LIMIT: number;

    @Validator.IsPositiveInt()
    declare public ROLE_PER_ACCOUNT_LIMIT: number;

    @Validator.IsPositiveInt()
    declare public PERMISSION_PER_REALM_LIMIT: number;

    @Validator.IsPositiveInt()
    declare public PERMISSION_PER_ROLE_LIMIT: number;

    @Validator.IsPositiveInt()
    declare public PERMISSION_OVERRIDE_PER_ACCOUNT_LIMIT: number;

    @Validator.IsPositiveInt()
    declare public CONFLICT_GROUP_PER_REALM_LIMIT: number;

    @Validator.IsPositiveInt()
    declare public MAX_CONFLICT_MEMBERS_COUNT: number;

    @Validator.IsPositiveInt()
    declare public DELEGATION_POLICY_PER_ROLE_LIMIT: number;

    @Validator.IsPositiveInt()
    declare public MAX_ROLE_SUBTREE_SIZE_FOR_PURGE: number;

    @Validator.IsPositiveInt()
    declare public BULK_OPERATION_LIMIT: number;
}
