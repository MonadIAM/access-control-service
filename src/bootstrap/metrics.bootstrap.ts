import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { Counter, Gauge, Histogram } from "prom-client";
import { getToken } from "@willsoto/nestjs-prometheus";
import { RawServerDefault } from "fastify";

import {
    HTTP_REQUEST_METRICS_IN_FLIGHT_LABELS,
    HTTP_REQUEST_METRICS_STARTED_AT,
    HTTP_REQUEST_METRICS_RECORDED,
} from "~observability/metrics/tokens";

export abstract class BootstrapMetrics {
    public static registerMetricsHooks(application: NestFastifyApplication<RawServerDefault>): void {
        const histogram = application.get<Histogram<string>>(getToken("http_request_duration_seconds"));
        const inFlightGauge = application.get<Gauge<string>>(getToken("http_in_flight_requests"));
        const counter = application.get<Counter<string>>(getToken("http_requests_total"));

        application
            .getHttpAdapter()
            .getInstance()
            .addHook("onRequest", (request, _reply, done) => {
                const metricsRequest = request as Observability.Metrics.Http.Request;
                if (!this.shouldSkipRequest({ request: metricsRequest })) {
                    metricsRequest[HTTP_REQUEST_METRICS_STARTED_AT] = Date.now();
                }
                done();
            })
            .addHook("preHandler", (request, _reply, done) => {
                const metricsRequest = request as Observability.Metrics.Http.Request;
                if (!this.shouldSkipRequest({ request: metricsRequest })) {
                    const labels = {
                        method: metricsRequest.method,
                        route: metricsRequest.routeOptions?.url ?? "unmapped",
                    };

                    metricsRequest[HTTP_REQUEST_METRICS_IN_FLIGHT_LABELS] = labels;
                    inFlightGauge.inc(labels);
                }
                done();
            })
            .addHook("onResponse", (request, reply, done) => {
                const metricsRequest = request as Observability.Metrics.Http.Request;
                if (!this.shouldSkipRequest({ request: metricsRequest })) {
                    const labels = metricsRequest[HTTP_REQUEST_METRICS_IN_FLIGHT_LABELS];
                    if (labels) {
                        inFlightGauge.dec(labels);
                    }
                    this.recordHttpRequestMetric({
                        duration: this.resolveDuration({ request: metricsRequest }),
                        statusCode: reply.statusCode,
                        request: metricsRequest,
                        histogram,
                        counter,
                    });
                }
                done();
            });
    }

    private static recordHttpRequestMetric(
        props: Bootstrap.Metrics.RecordHttpRequestMetric.Props,
    ): Bootstrap.Metrics.RecordHttpRequestMetric.Result {
        const { counter, duration, histogram, request, statusCode } = props;
        if (!request[HTTP_REQUEST_METRICS_RECORDED]) {
            const labels = {
                method: request.method,
                route: request.routeOptions?.url ?? "unmapped",
                status_code: String(statusCode),
            };

            counter.inc(labels);
            histogram.observe(labels, duration);
            request[HTTP_REQUEST_METRICS_RECORDED] = true;
        }
    }

    private static resolveDuration(
        props: Bootstrap.Metrics.ResolveDuration.Props,
    ): Bootstrap.Metrics.ResolveDuration.Result {
        const startedAt = props.request[HTTP_REQUEST_METRICS_STARTED_AT];
        return startedAt ? (Date.now() - startedAt) / 1e3 : 0;
    }

    private static shouldSkipRequest(
        props: Bootstrap.Metrics.ShouldSkipRequest.Props,
    ): Bootstrap.Metrics.ShouldSkipRequest.Result {
        const path = props.request.url.split("?")[0] ?? "";
        return path === "/metrics" || path.endsWith("/metrics") || path === "/docs" || path.startsWith("/docs/");
    }
}
