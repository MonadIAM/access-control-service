import { makeCounterProvider, makeGaugeProvider, makeHistogramProvider } from "@willsoto/nestjs-prometheus";

const RPS_PROVIDER = makeCounterProvider({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
});

const DURATION_PROVIDER = makeHistogramProvider({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
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

const SERVER_ERRORS_PROVIDER = makeCounterProvider({
    name: "app_server_errors_total",
    help: "Total number of HTTP server errors",
    labelNames: ["type"],
});

export const PROVIDERS = [
    SERVER_ERRORS_PROVIDER,
    EVENT_LOOP_LAG_PROVIDER,
    APP_STATUS_PROVIDER,
    DURATION_PROVIDER,
    RPS_PROVIDER,
];
