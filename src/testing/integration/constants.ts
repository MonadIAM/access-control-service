export const POSTGRES_IMAGE = "postgres:17-alpine";
export const DATABASE_NAME = "access_control_test";
export const DATABASE_USER = "access_control";
export const DATABASE_PASSWORD = "access_control";

export const CONNECTION_ENV_KEYS = {
    database: "MONADIAM_TEST_POSTGRES_DATABASE",
    username: "MONADIAM_TEST_POSTGRES_USERNAME",
    password: "MONADIAM_TEST_POSTGRES_PASSWORD",
    host: "MONADIAM_TEST_POSTGRES_HOST",
    port: "MONADIAM_TEST_POSTGRES_PORT",
} as const;

export const TRUNCATED_SCHEMAS = ["access_control", "system"];
export const EXCLUDED_TABLES = ["mikro_orm_migrations"];
export const IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]*$/;
