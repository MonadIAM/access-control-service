import { Validator } from "~common/validator";
import { NodeEnv } from "~common/enums";

export class EnvironmentVariablesDTO {
    // ---------------------------------------------------------------------------
    // App
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public SERVICE_NAME!: string;

    @Validator.IsEnum(NodeEnv)
    public NODE_ENV!: NodeEnv;

    @Validator.IsPositiveInt()
    public API_VERSION!: number;

    @Validator.IsString()
    public APP_BASE_IMAGE!: string;

    @Validator.IsString()
    public APP_HOST!: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public APP_PORT!: number;

    @Validator.IsPositiveInt()
    public THROTTLE_LIMIT!: number;

    @Validator.IsPositiveInt()
    public THROTTLE_TTL!: number;

    @Validator.IsString()
    public JWT_SECRET!: string;

    // ---------------------------------------------------------------------------
    // PostgreSQL - common
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public POSTGRES_IMAGE!: string;

    @Validator.IsString()
    public POSTGRES_DB!: string;

    @Validator.IsString()
    public POSTGRES_USER!: string;

    @Validator.IsString()
    public POSTGRES_PASSWORD!: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public POSTGRES_PORT!: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public POSTGRES_REPLICA_PORT!: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public POSTGRES_CONTAINER_PORT!: number;

    @Validator.IsBoolean()
    public POSTGRES_SSL!: boolean;

    @Validator.IsBoolean()
    public POSTGRES_SSL_REJECT_UNAUTHORIZED!: boolean;

    @Validator.IsInt()
    @Validator.Min(0)
    public POSTGRES_POOL_IDLE_MS!: number;

    @Validator.IsPositiveInt()
    public POSTGRES_POOL_MAX!: number;

    @Validator.IsBoolean()
    public POSTGRES_LOGGING!: boolean;

    @Validator.IsBoolean()
    public POSTGRES_CQRS_ENABLED!: boolean;

    // ---------------------------------------------------------------------------
    // PostgreSQL - write-side
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    @Validator.IsOptional()
    public POSTGRES_HOST?: string;

    @Validator.IsString()
    @Validator.IsOptional()
    public POSTGRES_WRITE_HOST?: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    @Validator.IsOptional()
    public POSTGRES_WRITE_PORT?: number;

    @Validator.IsPositiveInt()
    public POSTGRES_WRITE_POOL_MAX!: number;

    @Validator.IsInt()
    @Validator.Min(0)
    public POSTGRES_WRITE_POOL_IDLE_MS!: number;

    // ---------------------------------------------------------------------------
    // PostgreSQL - read-side
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    @Validator.IsOptional()
    public POSTGRES_READ_HOST?: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    @Validator.IsOptional()
    public POSTGRES_READ_PORT?: number;

    @Validator.IsPositiveInt()
    public POSTGRES_READ_POOL_MAX!: number;

    @Validator.IsInt()
    @Validator.Min(0)
    public POSTGRES_READ_POOL_IDLE_MS!: number;

    // ---------------------------------------------------------------------------
    // PostgreSQL - replication
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public POSTGRES_REPLICATION_USER!: string;

    @Validator.IsString()
    public POSTGRES_REPLICATION_PASSWORD!: string;

    @Validator.IsString()
    public POSTGRES_REPLICATION_SLOT!: string;

    // ---------------------------------------------------------------------------
    // Redis
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public REDIS_IMAGE!: string;

    @Validator.IsString()
    @Validator.IsOptional()
    public REDIS_HOST?: string;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public REDIS_PORT!: number;

    @Validator.IsPositiveInt()
    @Validator.Max(65535)
    public REDIS_CONTAINER_PORT!: number;

    @Validator.IsString()
    public REDIS_PASSWORD!: string;

    @Validator.IsInt()
    @Validator.Min(0)
    public REDIS_DB_CACHE!: number;

    @Validator.IsInt()
    @Validator.Min(0)
    public REDIS_DB_LIMITER!: number;

    @Validator.IsInt()
    @Validator.Min(0)
    public REDIS_DB_QUEUE!: number;

    // ---------------------------------------------------------------------------
    // Redis - services
    // ---------------------------------------------------------------------------

    @Validator.IsPositiveInt()
    public PERMISSION_CACHE_TTL!: number;

    // ---------------------------------------------------------------------------
    // Kafka
    // ---------------------------------------------------------------------------

    @Validator.IsString()
    public KAFKA_BROKER!: string;

    @Validator.IsPositiveInt()
    public KAFKA_RETRY_ATTEMPTS!: number;

    @Validator.IsInt()
    @Validator.Min(0)
    public KAFKA_RETRY_INITIAL_TIME!: number;

    @Validator.IsString()
    public DOCKER_NETWORK_NAME!: string;

    // ---------------------------------------------------------------------------
    // Domain-specific limits
    // ---------------------------------------------------------------------------

    @Validator.IsPositiveInt()
    public REALM_LIMIT!: number;

    @Validator.IsPositiveInt()
    public ROLE_PER_REALM_LIMIT!: number;

    @Validator.IsPositiveInt()
    public ROLE_PER_ACCOUNT_LIMIT!: number;

    @Validator.IsPositiveInt()
    public PERMISSION_PER_REALM_LIMIT!: number;

    @Validator.IsPositiveInt()
    public PERMISSION_PER_ROLE_LIMIT!: number;

    @Validator.IsPositiveInt()
    public PERMISSION_OVERRIDE_PER_ACCOUNT_LIMIT!: number;

    @Validator.IsPositiveInt()
    public CONFLICT_GROUP_PER_REALM_LIMIT!: number;

    @Validator.IsPositiveInt()
    public MAX_CONFLICT_MEMBERS_COUNT!: number;

    @Validator.IsPositiveInt()
    public DELEGATION_POLICY_PER_ROLE_LIMIT!: number;

    @Validator.IsPositiveInt()
    public MAX_ROLE_SUBTREE_SIZE_FOR_PURGE!: number;

    @Validator.IsPositiveInt()
    public BULK_OPERATION_LIMIT!: number;

    // ---------------------------------------------------------------------------
    // BullMQ
    // ---------------------------------------------------------------------------

    @Validator.IsPositiveInt()
    public PERMISSION_CACHE_INVALIDATION_CHUNK_SIZE!: number;
}
