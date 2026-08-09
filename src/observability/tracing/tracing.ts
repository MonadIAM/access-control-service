/**
 * Preload script (`NODE_OPTIONS --require`), not a Nest module.
 * Loads before main.ts, does not participate in DI.
 */
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { defaultResource, resourceFromAttributes } from "@opentelemetry/resources";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import FastifyOtelInstrumentation from "@fastify/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { isMainThread } from "worker_threads";
import { diag } from "@opentelemetry/api";
import { readFileSync } from "fs";
import { cwd } from "process";
import { join } from "path";
import {
    ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
    ATTR_SERVICE_NAMESPACE,
    ATTR_SERVICE_VERSION,
    ATTR_SERVICE_NAME,
} from "@opentelemetry/semantic-conventions";

if (isMainThread) {
    const papackage = JSON.parse(readFileSync(join(cwd(), "package.json"), "utf8"));

    const resource = defaultResource().merge(
        resourceFromAttributes({
            [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV,
            [ATTR_SERVICE_NAME]: process.env.SERVICE_NAME,
            [ATTR_SERVICE_VERSION]: papackage.version,
            [ATTR_SERVICE_NAMESPACE]: "monadiam",
        }),
    );

    const sdk = new NodeSDK({
        resource,
        traceExporter: new OTLPTraceExporter(),
        metricReaders: [
            new PeriodicExportingMetricReader({
                exporter: new OTLPMetricExporter(),
            }),
        ],
        instrumentations: [
            getNodeAutoInstrumentations({
                "@opentelemetry/instrumentation-net": { enabled: false },
                "@opentelemetry/instrumentation-dns": { enabled: false },
                "@opentelemetry/instrumentation-fs": { enabled: false },
            }),
            new FastifyOtelInstrumentation({ registerOnInitialization: true }),
        ],
    });

    try {
        sdk.start();
        diag.info(`[OTEL] tracing started for ${process.env.SERVICE_NAME}`);
    } catch (error) {
        diag.error("[OTEL] failed to start tracing SDK", error);
    }

    for (const signal of ["SIGTERM", "SIGINT"]) {
        process.once(signal, () => {
            sdk.shutdown().catch((error) => diag.error("[OTEL] error shutting down tracing SDK", error));
        });
    }
}
