import { makeCounterProvider, makeGaugeProvider, makeHistogramProvider } from "@willsoto/nestjs-prometheus";
import { performance } from "node:perf_hooks";
import type { Gauge } from "prom-client";

import { PostgreSQLPoolRegistry } from "~infrastructure/database";
import { RedisConnectionRegistry } from "~infrastructure/redis";

let previousEventLoopUtilization = performance.eventLoopUtilization();

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const RPS_PROVIDER = makeCounterProvider({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
});

const DURATION_PROVIDER = makeHistogramProvider({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const IN_FLIGHT_PROVIDER = makeGaugeProvider({
    name: "http_in_flight_requests",
    help: "Current number of HTTP requests in flight",
    labelNames: ["method", "route"],
});

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

const APP_STATUS_PROVIDER = makeGaugeProvider({
    name: "app_status_info",
    help: "Application status (1 for Online, 0 for Offline/Starting)",
    labelNames: ["version", "environment"],
});

// ---------------------------------------------------------------------------
// Node.js
// ---------------------------------------------------------------------------

const EVENT_LOOP_LAG_PROVIDER = makeGaugeProvider({
    name: "nodejs_eventloop_lag_seconds",
    help: "Node.js event loop lag in seconds",
});

const EVENT_LOOP_UTILIZATION_PROVIDER = makeGaugeProvider({
    name: "nodejs_eventloop_utilization",
    help: "Node.js event loop utilization ratio since the previous scrape",
    collect(this: Gauge<string>): void {
        const utilization = performance.eventLoopUtilization(previousEventLoopUtilization);
        previousEventLoopUtilization = performance.eventLoopUtilization();
        this.set(utilization.utilization);
    },
});

// ---------------------------------------------------------------------------
// PostgreSQL
// ---------------------------------------------------------------------------

const POSTGRESQL_POOL_ACTIVE_CONNECTIONS_PROVIDER = makeGaugeProvider({
    name: "db_pool_active_connections",
    help: "Current number of active PostgreSQL pool connections",
    labelNames: ["connection"],
    inject: [PostgreSQLPoolRegistry],
    collect: function (this: Gauge<string>, registry: ORM.PoolRegistry.PublicContract): void {
        for (const stats of registry.snapshots()) {
            this.set({ connection: stats.kind }, stats.active);
        }
    },
});

const POSTGRESQL_POOL_IDLE_CONNECTIONS_PROVIDER = makeGaugeProvider({
    name: "db_pool_idle_connections",
    help: "Current number of idle PostgreSQL pool connections",
    labelNames: ["connection"],
    inject: [PostgreSQLPoolRegistry],
    collect: function (this: Gauge<string>, registry: ORM.PoolRegistry.PublicContract): void {
        for (const stats of registry.snapshots()) {
            this.set({ connection: stats.kind }, stats.idle);
        }
    },
});

const POSTGRESQL_POOL_WAITING_REQUESTS_PROVIDER = makeGaugeProvider({
    name: "db_pool_waiting_requests",
    help: "Current number of requests waiting for a PostgreSQL pool connection",
    labelNames: ["connection"],
    inject: [PostgreSQLPoolRegistry],
    collect: function (this: Gauge<string>, registry: ORM.PoolRegistry.PublicContract): void {
        for (const stats of registry.snapshots()) {
            this.set({ connection: stats.kind }, stats.waiting);
        }
    },
});

const POSTGRESQL_POOL_TOTAL_CONNECTIONS_PROVIDER = makeGaugeProvider({
    name: "db_pool_total_connections",
    help: "Current total number of PostgreSQL pool connections",
    labelNames: ["connection"],
    inject: [PostgreSQLPoolRegistry],
    collect: function (this: Gauge<string>, registry: ORM.PoolRegistry.PublicContract): void {
        for (const stats of registry.snapshots()) {
            this.set({ connection: stats.kind }, stats.total);
        }
    },
});

const POSTGRESQL_POOL_MAX_CONNECTIONS_PROVIDER = makeGaugeProvider({
    name: "db_pool_max_connections",
    help: "Configured maximum number of PostgreSQL pool connections",
    labelNames: ["connection"],
    inject: [PostgreSQLPoolRegistry],
    collect: function (this: Gauge<string>, registry: ORM.PoolRegistry.PublicContract): void {
        for (const stats of registry.snapshots()) {
            this.set({ connection: stats.kind }, stats.max);
        }
    },
});

// ---------------------------------------------------------------------------
// Redis
// ---------------------------------------------------------------------------

const REDIS_CLIENT_CONNECTED_PROVIDER = makeGaugeProvider({
    name: "redis_client_connected",
    help: "Current Redis client connection state",
    labelNames: ["connection"],
    inject: [RedisConnectionRegistry],
    collect: function (this: Gauge<string>, registry: RedisConnection.Registry.PublicContract): void {
        for (const snapshot of registry.snapshots()) {
            this.set({ connection: snapshot.kind }, snapshot.connected ? 1 : 0);
        }
    },
});

const REDIS_CLIENT_READY_PROVIDER = makeGaugeProvider({
    name: "redis_client_ready",
    help: "Current Redis client ready state",
    labelNames: ["connection"],
    inject: [RedisConnectionRegistry],
    collect: function (this: Gauge<string>, registry: RedisConnection.Registry.PublicContract): void {
        for (const snapshot of registry.snapshots()) {
            this.set({ connection: snapshot.kind }, snapshot.ready ? 1 : 0);
        }
    },
});

const REDIS_CLIENT_STATUS_PROVIDER = makeGaugeProvider({
    name: "redis_client_status",
    help: "Current Redis client status as one-hot labels",
    labelNames: ["connection", "status"],
    inject: [RedisConnectionRegistry],
    collect: function (this: Gauge<string>, registry: RedisConnection.Registry.PublicContract): void {
        for (const status of registry.statusValues()) {
            this.set({ connection: status.kind, status: status.status }, status.value);
        }
    },
});

// ---------------------------------------------------------------------------
// Kafka
// ---------------------------------------------------------------------------

const KAFKA_CONSUMER_ERRORS_PROVIDER = makeCounterProvider({
    name: "kafka_consumer_errors_total",
    help: "Total number of Kafka consumer errors handled by the application",
    labelNames: ["topic", "disposition", "error_type"],
});

const KAFKA_RETRY_MESSAGES_PROVIDER = makeCounterProvider({
    name: "kafka_retry_messages_total",
    help: "Total number of Kafka consumer retry attempts scheduled by the application",
    labelNames: ["topic"],
});

const KAFKA_DLQ_MESSAGES_PROVIDER = makeCounterProvider({
    name: "kafka_dlq_messages_total",
    help: "Total number of Kafka messages sent to dead topics by the application",
    labelNames: ["topic"],
});

export const PROVIDERS = [
    POSTGRESQL_POOL_ACTIVE_CONNECTIONS_PROVIDER,
    POSTGRESQL_POOL_TOTAL_CONNECTIONS_PROVIDER,
    POSTGRESQL_POOL_WAITING_REQUESTS_PROVIDER,
    POSTGRESQL_POOL_IDLE_CONNECTIONS_PROVIDER,
    POSTGRESQL_POOL_MAX_CONNECTIONS_PROVIDER,
    EVENT_LOOP_UTILIZATION_PROVIDER,
    REDIS_CLIENT_CONNECTED_PROVIDER,
    KAFKA_CONSUMER_ERRORS_PROVIDER,
    KAFKA_RETRY_MESSAGES_PROVIDER,
    REDIS_CLIENT_STATUS_PROVIDER,
    KAFKA_DLQ_MESSAGES_PROVIDER,
    REDIS_CLIENT_READY_PROVIDER,
    EVENT_LOOP_LAG_PROVIDER,
    APP_STATUS_PROVIDER,
    IN_FLIGHT_PROVIDER,
    DURATION_PROVIDER,
    RPS_PROVIDER,
];
