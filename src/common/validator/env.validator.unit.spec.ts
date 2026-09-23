import { describe, expect, it } from "@jest/globals";

import { EnvironmentVariablesDTO } from "~common/dto";

import { validateEnv } from "./env.validator";

// Synthetic configuration: never reads local environment files or credentials.
const config = {
    SERVICE_NAME: "test",
    NODE_ENV: "local",
    API_VERSION: "1",
    APP_BASE_IMAGE: "test",
    APP_HOST: "test",
    APP_PORT: "3000",
    GRPC_HOST: "test",
    GRPC_PORT: "1",
    THROTTLE_LIMIT: "1",
    THROTTLE_TTL: "1s",
    HSTS_MAX_AGE: "1s",
    BODY_LIMIT_BYTES: "1",
    JWT_ISSUER: "test",
    JWT_JWKS_URL: "test",
    JWT_JWKS_COOLDOWN_DURATION: "test",
    JWT_JWKS_TIMEOUT_DURATION: "test",
    JWT_JWKS_CACHE_MAX_AGE: "test",
    IDENTITY_SERVICE_URL: "test",
    ACCESS_CONTROL_SERVICE_URL: "test",
    NOTIFICATION_SERVICE_URL: "test",
    TEMPLATE_SERVICE_URL: "test",
    DOCS_OAUTH_CLIENT_ID: "550e8400-e29b-41d4-a716-446655440000",
    ALLOWED_SERVICE_ORIGINS: "test",
    ALLOWED_UI_ORIGINS: "test",
    OTEL_EXPORTER_OTLP_ENDPOINT: "test",
    OTEL_LOG_LEVEL: "INFO",
    OTEL_LOGS_EXPORTER: "none",
    OTEL_TRACES_SAMPLER: "always_off",
    OTEL_TRACES_SAMPLER_ARG: "0.5",
    POSTGRES_DB: "test",
    POSTGRES_USER: "test",
    POSTGRES_PASSWORD: "test",
    POSTGRES_LOGGING: "false",
    POSTGRES_WRITE_HOST: "test",
    POSTGRES_WRITE_PORT: "1",
    POSTGRES_WRITE_POOL_MAX: "1",
    POSTGRES_WRITE_POOL_IDLE_MS: "1s",
    POSTGRES_READ_HOST: "test",
    POSTGRES_READ_PORT: "1",
    POSTGRES_READ_POOL_MAX: "1",
    POSTGRES_READ_POOL_IDLE_MS: "1s",
    REDIS_HOST: "test",
    REDIS_PORT: "1",
    REDIS_PASSWORD: "test",
    REDIS_DB_CACHE: "1",
    REDIS_DB_LIMITER: "1",
    REDIS_DB_QUEUE: "1",
    KAFKA_BROKER: "test",
    KAFKA_RETRY_ATTEMPTS: "1",
    KAFKA_PARTITIONS_CONSUMED_CONCURRENTLY: "1",
    KAFKA_RETRY_INITIAL_TIME: "1s",
    KAFKAJS_NO_PARTITIONER_WARNING: "1",
    KAFKA_CONSUMER_MAX_RETRIES: "1",
    KAFKA_CONSUMER_RETRY_INITIAL_DELAY: "1s",
    KAFKA_CONSUMER_RETRY_MAX_DELAY: "1s",
    SCHEMA_REGISTRY_URL: "test",
    AUDIT_LOG_RETENTION_TTL: "1s",
    CHANGE_LOG_RETENTION_TTL: "1s",
    INBOX_RETENTION_TTL: "1s",
    CLEANUP_BATCH_SIZE: "1",
    CLEANUP_BATCH_DELAY: "1s",
    CLEANUP_BATCH_BACKOFF_DELAY: "1s",
    CLEANUP_BATCH_ATTEMPTS: "1",
    DOCKER_NETWORK_KAFKA: "test",
    DOCKER_NETWORK_POSTGRES: "test",
    DOCKER_NETWORK_REDIS: "test",
    DOCKER_NETWORK_VAULT: "test",
    VAULT_IMAGE: "test",
    VAULT_AGENT_SOCKET_PATH: "test",
    VAULT_APPROLE_NAME: "test",
    VAULT_TRANSIT_MOUNT: "test",
    VAULT_TRANSIT_AUDIT_MASK_KEY: "test",
    VAULT_TRANSIT_AUDIT_LOG_KEY: "test",
    REALM_LIMIT: "1",
    ROLE_PER_REALM_LIMIT: "1",
    ROLE_PER_ACCOUNT_LIMIT: "1",
    PERMISSION_PER_REALM_LIMIT: "1",
    PERMISSION_PER_ROLE_LIMIT: "1",
    PERMISSION_OVERRIDE_PER_ACCOUNT_LIMIT: "1",
    CONFLICT_GROUP_PER_REALM_LIMIT: "1",
    MAX_CONFLICT_MEMBERS_COUNT: "1",
    DELEGATION_POLICY_PER_ROLE_LIMIT: "1",
    MAX_ROLE_SUBTREE_SIZE_FOR_PURGE: "1",
    BULK_OPERATION_LIMIT: "1",
    VAULT_ADDR: "http://localhost:8200",
    VAULT_TOKEN: "test-only-token",
};

describe("validateEnv", () => {
    it("returns a typed configuration with explicit number and boolean conversion", () => {
        const result = validateEnv(config);

        expect(result).toBeInstanceOf(EnvironmentVariablesDTO);
        expect(result.APP_PORT).toBe(3000);
        expect(result.POSTGRES_LOGGING).toBe(false);
        expect(result.SERVICE_NAME).toBe("test");
        expect(config.APP_PORT).toBe("3000");
    });

    it("rejects missing required fields and aggregates their validation errors", () => {
        expect(() => validateEnv({ ...config, SERVICE_NAME: undefined, APP_PORT: undefined })).toThrow(/SERVICE_NAME/);
        expect(() => validateEnv({ ...config, SERVICE_NAME: undefined, APP_PORT: undefined })).toThrow(/APP_PORT/);
    });

    it.each([
        { field: "APP_PORT", value: "65536" },
        { field: "POSTGRES_LOGGING", value: "garbage" },
        { field: "THROTTLE_TTL", value: "1garbage" },
        { field: "NODE_ENV", value: "unknown" },
        { field: "SERVICE_NAME", value: 123 },
    ])("rejects invalid $field without implicit string coercion", ({ field, value }) => {
        expect(() => validateEnv({ ...config, [field]: value })).toThrow(field);
    });

    it("requires enabled feature settings but accepts their absence when disabled", () => {
        expect(() => validateEnv({ ...config, LOKI_ENABLED: "false" })).not.toThrow();
        expect(() => validateEnv({ ...config, LOKI_ENABLED: "true" })).toThrow("LOKI_URL");
        expect(
            validateEnv({
                ...config,
                LOKI_URL: "http://localhost:3100",
                LOKI_BATCH_INTERVAL: "1000",
                LOKI_ENABLED: "true",
            }),
        ).toMatchObject({ LOKI_ENABLED: true, LOKI_BATCH_INTERVAL: 1000 });
    });
});
