import { SpanContext, Link } from "@opentelemetry/api";
import { ReadableSpan } from "@opentelemetry/sdk-trace";
import { ExportResult } from "@opentelemetry/core";

declare global {
    namespace Tracing {
        type Context = Omit<SpanContext, "traceState"> & { traceState?: string };

        type Snapshot = Omit<ReadableSpan, "spanContext" | "parentSpanContext" | "resource" | "links"> & {
            context: Context;
            parentSpanContext?: Context;
            resource: { attributes: ReadableSpan["resource"]["attributes"]; schemaUrl?: string };
            links: (Omit<Link, "context"> & { context: Context })[];
        };

        type Request = { id: number } & ({ operation: "export"; spans: Snapshot[] } | { operation: "flush" | "shutdown" });

        type Response = { id: number; code: ExportResult["code"]; error?: string };

        type Pending = {
            resolve(result: ExportResult): void;
            timer: NodeJS.Timeout;
        };
    }
}
