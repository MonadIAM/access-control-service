import { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace";
import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import { SpanContext } from "@opentelemetry/api";
import { Worker } from "worker_threads";
import { join } from "path";

export class WorkerTraceExporter implements SpanExporter {
    private readonly worker = new Worker(join(__dirname, "worker.js"), { execArgv: [] });
    private readonly pending = new Map<number, Tracing.Pending>();
    private sequence = 0;
    private failure?: Error;
    private shutdownPromise?: Promise<void>;

    public constructor() {
        this.worker.on("message", (response: Tracing.Response) => {
            const request = this.pending.get(response.id);
            if (request) {
                clearTimeout(request.timer);
                this.pending.delete(response.id);
                if (this.pending.size === 0) {
                    this.worker.unref();
                }
                request.resolve({
                    code: response.code,
                    error: response.error ? new Error(response.error) : undefined,
                });
            }
        });
        this.worker.on("error", (error) => this.fail(error));
        this.worker.on("exit", () => this.fail(new Error("Trace worker stopped")));
        this.worker.unref();
    }

    public export(spans: ReadableSpan[], callback: (result: ExportResult) => void): void {
        if (this.shutdownPromise || this.failure || this.pending.size >= 4) {
            callback({ code: ExportResultCode.FAILED, error: this.failure ?? new Error("Trace worker unavailable") });
        } else {
            const snapshots: Tracing.Snapshot[] = [];
            for (const span of spans) {
                const links: Tracing.Snapshot["links"] = [];
                for (const link of span.links) {
                    links.push({ ...link, context: this.snapshotContext(link.context) });
                }
                snapshots.push({
                    context: this.snapshotContext(span.spanContext()),
                    parentSpanContext: span.parentSpanContext && this.snapshotContext(span.parentSpanContext),
                    resource: { attributes: span.resource.attributes, schemaUrl: span.resource.schemaUrl },
                    droppedAttributesCount: span.droppedAttributesCount,
                    instrumentationScope: span.instrumentationScope,
                    droppedEventsCount: span.droppedEventsCount,
                    droppedLinksCount: span.droppedLinksCount,
                    attributes: span.attributes,
                    startTime: span.startTime,
                    duration: span.duration,
                    endTime: span.endTime,
                    status: span.status,
                    events: span.events,
                    ended: span.ended,
                    name: span.name,
                    kind: span.kind,
                    links,
                });
            }
            void this.send({ id: ++this.sequence, operation: "export", spans: snapshots }).then(callback);
        }
    }

    public async forceFlush(): Promise<void> {
        const result = await this.send({ id: ++this.sequence, operation: "flush" });
        if (result.code === ExportResultCode.FAILED) {
            throw result.error ?? new Error("Trace worker flush failed");
        }
    }

    public shutdown(): Promise<void> {
        this.shutdownPromise ??= this.stop();
        return this.shutdownPromise;
    }

    private async stop(): Promise<void> {
        try {
            const result = await this.send({ id: ++this.sequence, operation: "shutdown" });
            if (result.code === ExportResultCode.FAILED) {
                throw result.error ?? new Error("Trace worker shutdown failed");
            }
        } finally {
            await this.worker.terminate();
        }
    }

    private snapshotContext(context: SpanContext): Tracing.Context {
        return { ...context, traceState: context.traceState?.serialize() };
    }

    private send(request: Tracing.Request): Promise<ExportResult> {
        return new Promise((resolve) => {
            if (this.failure) {
                resolve({ code: ExportResultCode.FAILED, error: this.failure });
            } else {
                const timer = setTimeout(() => {
                    this.fail(new Error("Trace worker timed out"));
                    void this.worker.terminate();
                }, 30000);
                this.pending.set(request.id, { resolve, timer });
                this.worker.ref();
                try {
                    this.worker.postMessage(request);
                } catch (error) {
                    this.fail(error instanceof Error ? error : new Error("Trace worker message failed"));
                    void this.worker.terminate();
                }
            }
        });
    }

    private fail(error: Error): void {
        this.failure ??= error;
        for (const request of this.pending.values()) {
            clearTimeout(request.timer);
            request.resolve({ code: ExportResultCode.FAILED, error: this.failure });
        }
        this.pending.clear();
        this.worker.unref();
    }
}
