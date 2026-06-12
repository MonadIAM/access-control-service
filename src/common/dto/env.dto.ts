import { StringValue } from "ms";

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
    declare public IDENTITY_SERVICE_URL: string;

    @Validator.IsString()
    declare public ACCESS_CONTROL_SERVICE_URL: string;

    @Validator.IsString()
    declare public ALLOWED_SERVICE_ORIGINS: string;

    @Validator.IsString()
    declare public ALLOWED_UI_ORIGINS: string;

    // ---------------------------------------------------------------------------
    // PostgreSQL - common
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_IMAGE: string;

    @Validator.IsString()
    declare public POSTGRES_DB: string;

    @Validator.IsString()
    declare public POSTGRES_USER: string;

    @Validator.IsString()
    declare public POSTGRES_PASSWORD: string;

    @Validator.IsString()
    declare public POSTGRES_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_PORT: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_PRIMARY_PUBLISHED_PORT: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public POSTGRES_REPLICA_PUBLISHED_PORT: number;

    @Validator.IsBoolean()
    declare public POSTGRES_SSL: boolean;

    @Validator.IsBoolean()
    declare public POSTGRES_SSL_REJECT_UNAUTHORIZED: boolean;

    @Validator.IsPositiveInt()
    declare public POSTGRES_POOL_MAX: number;

    @Validator.IsMsString()
    declare public POSTGRES_POOL_IDLE_MS: StringValue;

    @Validator.IsBoolean()
    declare public POSTGRES_LOGGING: boolean;

    @Validator.IsBoolean()
    declare public POSTGRES_CQRS_ENABLED: boolean;

    // ---------------------------------------------------------------------------
    // PostgreSQL - write
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_WRITE_HOST: string;

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
    declare public POSTGRES_READ_POOL_MAX: number;

    @Validator.IsMsString()
    declare public POSTGRES_READ_POOL_IDLE_MS: StringValue;

    // ---------------------------------------------------------------------------
    // PostgreSQL - replication
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public POSTGRES_REPLICATION_USER: string;

    @Validator.IsString()
    declare public POSTGRES_REPLICATION_SLOT: string;

    // ---------------------------------------------------------------------------
    // Redis
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public REDIS_IMAGE: string;

    @Validator.IsString()
    declare public REDIS_HOST: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public REDIS_PORT: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public REDIS_PUBLISHED_PORT: number;

    @Validator.IsString()
    declare public REDIS_PASSWORD: string;

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

    @Validator.IsPositiveInt()
    declare public KAFKA_RETRY_ATTEMPTS: number;

    @Validator.IsMsString()
    declare public KAFKA_RETRY_INITIAL_TIME: StringValue;

    @Validator.IsString()
    declare public DOCKER_NETWORK_NAME: string;

    @Validator.IsString()
    declare public KAFKA_CONNECT_IMAGE: string;

    @Validator.IsInt()
    @Validator.Min(0)
    declare public KAFKA_CONNECT_PORT: number;

    @Validator.IsInt()
    declare public KAFKAJS_NO_PARTITIONER_WARNING: number;

    @Validator.IsInt()
    declare public KAFKA_DLQ_MAX_RETRIES: number;

    @Validator.IsMsString()
    declare public KAFKA_DLQ_RETRY_BASE_DELAY: StringValue;

    @Validator.IsMsString()
    declare public KAFKA_DLQ_RETRY_JITTER: StringValue;

    // ---------------------------------------------------------------------------
    // Debezium
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public DEBEZIUM_INIT_IMAGE: string;

    // ---------------------------------------------------------------------------
    // Vault
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    declare public VAULT_IMAGE: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public VAULT_PORT: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    declare public VAULT_PUBLISHED_PORT: number;

    @Validator.IsString()
    declare public VAULT_ROOT_TOKEN: string;

    @Validator.IsString()
    declare public VAULT_KV_MOUNT: string;

    @Validator.IsString()
    declare public VAULT_KV_RUNTIME_PATH: string;

    @Validator.IsString()
    declare public VAULT_KV_REPLICATION_PATH: string;

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
