import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { InMemorySpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace";
import { context, propagation, trace } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";

import { Exception } from "~common/exceptions";

import { KafkaTracing } from "./tracing";

describe("[Utility] - KafkaTracing", () => {
    const exporter = new InMemorySpanExporter();
    const processor = new SimpleSpanProcessor({ exporter });
    const sdk = new NodeSDK({
        autoDetectResources: false,
        spanProcessors: [processor],
        logRecordProcessors: [],
        metricReaders: [],
    });

    beforeAll(() => {
        sdk.start();
    });

    beforeEach(() => {
        exporter.reset();
    });

    afterAll(async () => {
        await sdk.shutdown();
        trace.disable();
        propagation.disable();
        context.disable();
    });

    describe("[Method] - run", () => {
        it("[case] - propagates the existing context through Kafka headers without creating spans", async () => {
            // Arrange
            const original = { source: "integration" };

            // Act
            const parent = KafkaTracing.extract({
                traceparent: "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01",
            });
            const headers = await KafkaTracing.run(() => Promise.resolve(KafkaTracing.inject(original)), parent);
            const received = await KafkaTracing.run(
                () => Promise.resolve(trace.getSpanContext(context.active())),
                KafkaTracing.extract(headers),
            );
            await processor.forceFlush();

            // Assert
            expect(original).toEqual({ source: "integration" });
            expect(headers.source).toBe("integration");
            expect(headers.traceparent).toBe("00-0123456789abcdef0123456789abcdef-0123456789abcdef-01");
            expect(received?.traceId).toBe("0123456789abcdef0123456789abcdef");
            expect(received?.spanId).toBe("0123456789abcdef");
            expect(exporter.getFinishedSpans()).toHaveLength(0);
        });

        it("[case] - preserves the handler failure without creating spans", async () => {
            // Arrange
            const error = Exception.externalServiceFailed({ messageKey: "temporary" });

            // Act
            const result = KafkaTracing.run(() => Promise.reject(error));

            // Assert
            await expect(result).rejects.toBe(error);
            await processor.forceFlush();
            expect(exporter.getFinishedSpans()).toHaveLength(0);
        });

        it("[case] - respects an unsampled remote parent encoded as a buffer", async () => {
            // Arrange
            const parent = KafkaTracing.extract({
                traceparent: Buffer.from("00-0123456789abcdef0123456789abcdef-0123456789abcdef-00"),
            });

            // Act
            const result = await KafkaTracing.run(() => Promise.resolve("handled"), parent);

            // Assert
            expect(result).toBe("handled");
            expect(exporter.getFinishedSpans()).toHaveLength(0);
        });
    });
});
