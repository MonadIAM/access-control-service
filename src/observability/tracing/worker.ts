import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import { createTraceState, SpanContext, diag } from "@opentelemetry/api";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ReadableSpan } from "@opentelemetry/sdk-trace";
import { normalize } from "@libpg-query/parser";
import { parentPort } from "worker_threads";

const exporter = new OTLPTraceExporter();
let queue = Promise.resolve();

function restoreContext(context: Tracing.Context): SpanContext {
    return { ...context, traceState: context.traceState ? createTraceState(context.traceState) : undefined };
}

async function restoreSpan(snapshot: Tracing.Snapshot): Promise<ReadableSpan> {
    const attributes = snapshot.attributes;
    if (snapshot.instrumentationScope.name === "@opentelemetry/instrumentation-pg") {
        const query = attributes["db.query.text"] ?? attributes["db.statement"];
        delete attributes["db.query.text"];
        delete attributes["db.statement"];
        if (typeof query === "string" && query.trim()) {
            try {
                attributes["db.query.text"] = await normalize(query);
            } catch {
                diag.warn("[OTEL] failed to normalize PostgreSQL query text");
            }
        }
    }
    const links: ReadableSpan["links"] = [];
    for (const link of snapshot.links) {
        links.push({ ...link, context: restoreContext(link.context) });
    }
    return {
        ...snapshot,
        spanContext: () => restoreContext(snapshot.context),
        parentSpanContext: snapshot.parentSpanContext && restoreContext(snapshot.parentSpanContext),
        resource: resourceFromAttributes(snapshot.resource.attributes, { schemaUrl: snapshot.resource.schemaUrl }),
        links,
    };
}

async function handle(request: Tracing.Request): Promise<void> {
    let result: ExportResult = { code: ExportResultCode.SUCCESS };
    try {
        if (request.operation === "export") {
            const pending: Promise<ReadableSpan>[] = [];
            for (const snapshot of request.spans) {
                pending.push(restoreSpan(snapshot));
            }
            const spans = await Promise.all(pending);
            result = await new Promise<ExportResult>((resolve) => exporter.export(spans, resolve));
        } else if (request.operation === "flush") {
            await exporter.forceFlush();
        } else {
            await exporter.shutdown();
        }
    } catch {
        result = { code: ExportResultCode.FAILED, error: new Error("Trace worker export failed") };
    }
    const response: Tracing.Response = { id: request.id, code: result.code, error: result.error?.message };
    parentPort?.postMessage(response);
}

parentPort?.on("message", (request: Tracing.Request) => {
    queue = queue.then(() => handle(request));
});
