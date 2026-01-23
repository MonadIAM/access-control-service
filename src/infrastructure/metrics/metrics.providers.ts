import { makeCounterProvider, makeHistogramProvider } from "@willsoto/nestjs-prometheus";

export const rpsProvider = makeCounterProvider({
    name: "http_requests_total",
    help: "Общее количество HTTP-запросов",
    labelNames: ["method", "route", "status"],
});

export const durationProvider = makeHistogramProvider({
    name: "http_request_duration_seconds",
    help: "Длительность запросов",
    labelNames: ["method", "route", "status"],
});
