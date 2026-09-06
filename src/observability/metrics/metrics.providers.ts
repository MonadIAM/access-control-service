import { makeCounterProvider, makeGaugeProvider, makeHistogramProvider } from "@willsoto/nestjs-prometheus";
import { performance } from "node:perf_hooks";
import type { Gauge } from "prom-client";

let previousEventLoopUtilization = performance.eventLoopUtilization();

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

const APP_STATUS_PROVIDER = makeGaugeProvider({
    name: "app_status_info",
    help: "Application status (1 for Online, 0 for Offline/Starting)",
    labelNames: ["version", "environment"],
});

const EVENT_LOOP_LAG_PROVIDER = makeGaugeProvider({
    name: "nodejs_eventloop_lag_seconds",
    help: "Node.js event loop lag in seconds",
});

const eventLoopUtilizationMetric: Parameters<typeof makeGaugeProvider>[0] & {
    collect(this: Gauge<string>): void;
} = {
    name: "nodejs_eventloop_utilization",
    help: "Node.js event loop utilization ratio since the previous scrape",
    collect(this: Gauge<string>): void {
        const utilization = performance.eventLoopUtilization(previousEventLoopUtilization);
        previousEventLoopUtilization = performance.eventLoopUtilization();
        this.set(utilization.utilization);
    },
};

const EVENT_LOOP_UTILIZATION_PROVIDER = makeGaugeProvider(eventLoopUtilizationMetric);

export const PROVIDERS = [
    EVENT_LOOP_UTILIZATION_PROVIDER,
    EVENT_LOOP_LAG_PROVIDER,
    APP_STATUS_PROVIDER,
    IN_FLIGHT_PROVIDER,
    DURATION_PROVIDER,
    RPS_PROVIDER,
];
