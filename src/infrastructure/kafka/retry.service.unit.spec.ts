import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { KafkaRetriableException } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";

import { Exception } from "~common/exceptions";

import type { KafkaRetryService as RetryService } from "./retry.service";

const sleep = jest.fn<(delay: number, value: undefined, options: { signal: AbortSignal }) => Promise<void>>();
jest.unstable_mockModule("node:timers/promises", () => ({ setTimeout: sleep }));
let KafkaRetryService: typeof RetryService;

const transient = Exception.externalServiceFailed({ messageKey: "temporary" });
const permanent = Exception.unprocessable({ messageKey: "invalid" });
const metrics = {
    recordRetry: jest.fn<Observability.Metrics.Kafka.RecordRetry.Signature>(),
    recordDead: jest.fn<Observability.Metrics.Kafka.RecordDead.Signature>(),
};

function create(maxRetries = 2): RetryService {
    return new KafkaRetryService(
        metrics,
        new ConfigService({
            KAFKA_CONSUMER_MAX_RETRIES: maxRetries,
            KAFKA_CONSUMER_RETRY_INITIAL_DELAY: "3s",
            KAFKA_CONSUMER_RETRY_MAX_DELAY: "5s",
        }),
    );
}

function callbacks(): {
    heartbeat: jest.Mock<() => Promise<void>>;
    process: jest.Mock<() => Promise<void>>;
    reject: jest.Mock<(error: unknown) => Promise<void>>;
    topic: string;
} {
    return {
        heartbeat: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        process: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        reject: jest.fn<(error: unknown) => Promise<void>>().mockResolvedValue(undefined),
        topic: "events",
    };
}

describe("[InfrastructureService] - KafkaRetry", () => {
    beforeAll(async () => {
        const modulePath = "./retry.service";
        ({ KafkaRetryService } = await import(modulePath));
    });

    let service: RetryService;
    let props: ReturnType<typeof callbacks>;

    beforeEach(() => {
        jest.useFakeTimers({ now: 0 });
        jest.spyOn(Math, "random").mockReturnValue(0.5);
        sleep.mockReset().mockImplementation(
            (delay, _value, { signal }) =>
                new Promise((resolve, reject) => {
                    signal.throwIfAborted();
                    const timer = setTimeout(() => {
                        signal.removeEventListener("abort", abort);
                        resolve();
                    }, delay);
                    function abort(): void {
                        clearTimeout(timer);
                        reject(signal.reason);
                    }
                    signal.addEventListener("abort", abort, { once: true });
                }),
        );
        service = create();
        props = callbacks();
    });

    afterEach(() => {
        service.onModuleDestroy();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe("[Method] - execute", () => {
        it("[case] - heartbeats before processing a successful message", async () => {
            // Arrange
            let heartbeatsBeforeProcessing = 0;
            props.process.mockImplementation(() => {
                heartbeatsBeforeProcessing = props.heartbeat.mock.calls.length;
                return Promise.resolve();
            });

            // Act
            await service.execute(props);

            // Assert
            expect(heartbeatsBeforeProcessing).toBe(1);
            expect(props.process).toHaveBeenCalledTimes(1);
            expect(props.reject).not.toHaveBeenCalled();
            expect(metrics.recordRetry).not.toHaveBeenCalled();
            expect(sleep).not.toHaveBeenCalled();
        });

        it("[case] - retries transient errors and heartbeats at most one second apart while waiting", async () => {
            // Arrange
            props.process.mockRejectedValueOnce(transient);

            // Act
            const result = service.execute(props);
            await jest.advanceTimersByTimeAsync(1499);
            const attemptsBeforeRetry = props.process.mock.calls.length;
            const heartbeatsBeforeRetry = props.heartbeat.mock.calls.length;
            await jest.advanceTimersByTimeAsync(1);
            await result;

            // Assert
            expect(attemptsBeforeRetry).toBe(1);
            expect(heartbeatsBeforeRetry).toBe(2);
            expect(props.process).toHaveBeenCalledTimes(2);
            expect(props.heartbeat).toHaveBeenCalledTimes(4);
            expect(sleep.mock.calls.map(([delay]) => delay)).toEqual([1000, 500]);
            expect(metrics.recordRetry.mock.calls).toEqual([[{ topic: "events", error: transient }]]);
            expect(props.reject).not.toHaveBeenCalled();
        });

        it("[case] - rejects after the configured number of retries", async () => {
            // Arrange
            props.process.mockRejectedValue(transient);

            // Act
            const result = service.execute(props);
            await jest.runAllTimersAsync();
            await result;

            // Assert
            expect(props.process).toHaveBeenCalledTimes(3);
            expect(metrics.recordRetry).toHaveBeenCalledTimes(2);
            expect(props.reject.mock.calls).toEqual([[transient]]);
            expect(metrics.recordDead).not.toHaveBeenCalled();
        });

        it("[case] - does not retry when the retry budget is zero", async () => {
            // Arrange
            service = create(0);
            props.process.mockRejectedValue(transient);

            // Act
            await service.execute(props);

            // Assert
            expect(props.process).toHaveBeenCalledTimes(1);
            expect(props.reject).toHaveBeenCalledWith(transient);
            expect(sleep).not.toHaveBeenCalled();
        });

        it.each([
            { label: "application error", value: permanent },
            { label: "string", value: "unclassified" },
        ])("[case] - rejects permanent errors without waiting ($label)", async ({ value: error }) => {
            // Arrange
            props.process.mockRejectedValue(error);

            // Act
            await service.execute(props);

            // Assert
            expect(props.reject.mock.calls).toEqual([[error]]);
            expect(metrics.recordRetry).not.toHaveBeenCalled();
            expect(sleep).not.toHaveBeenCalled();
        });

        it("[case] - returns Kafka retry exceptions to the transport without local retry or rejection", async () => {
            // Arrange
            props.process.mockRejectedValue(new KafkaRetriableException("transport retry"));

            // Act
            const result = service.execute(props);

            // Assert
            await expect(result).rejects.toBeInstanceOf(KafkaRetriableException);
            expect(props.process).toHaveBeenCalledTimes(1);
            expect(props.reject).not.toHaveBeenCalled();
            expect(metrics.recordRetry).not.toHaveBeenCalled();
        });

        it.each([
            { label: "Error", value: new Error("heartbeat failed") },
            { label: "string", value: "heartbeat failed" },
        ])("[case] - wraps heartbeat failures ($label)", async ({ value: error }) => {
            // Arrange
            props.heartbeat.mockRejectedValue(error);

            // Act
            const result = service.execute(props);

            // Assert
            await expect(result).rejects.toMatchObject({ message: "heartbeat failed" });
            expect(props.process).not.toHaveBeenCalled();
            expect(props.reject).not.toHaveBeenCalled();
        });

        it("[case] - propagates failure of the rejection handler to the transport", async () => {
            // Arrange
            props.process.mockRejectedValue(permanent);
            props.reject.mockRejectedValue(new Error("dead topic unavailable"));

            // Act
            const result = service.execute(props);

            // Assert
            await expect(result).rejects.toBeInstanceOf(KafkaRetriableException);
            expect(props.process).toHaveBeenCalledTimes(1);
        });
    });

    describe("[Method] - onModuleDestroy", () => {
        it("[case] - aborts an active backoff without another attempt or rejection", async () => {
            // Arrange
            props.process.mockRejectedValue(transient);

            // Act
            const result = service.execute(props);
            const settled = Promise.allSettled([result]);
            await jest.advanceTimersByTimeAsync(0);
            const waitsBeforeShutdown = sleep.mock.calls.length;
            service.onModuleDestroy();
            await settled;
            await Promise.allSettled([result]);
            const result2 = jest.getTimerCount();

            // Assert
            expect(waitsBeforeShutdown).toBe(1);
            await expect(result).rejects.toBeInstanceOf(KafkaRetriableException);
            expect(sleep.mock.calls[0][2].signal.aborted).toBe(true);
            expect(result2).toBe(0);
            expect(props.process).toHaveBeenCalledTimes(1);
            expect(props.reject).not.toHaveBeenCalled();
        });

        it("[case] - does not start processing after shutdown", async () => {
            // Arrange

            // Act
            service.onModuleDestroy();

            const result = service.execute(props);

            // Assert
            await expect(result).rejects.toBeInstanceOf(KafkaRetriableException);
            expect(props.heartbeat).not.toHaveBeenCalled();
            expect(props.process).not.toHaveBeenCalled();
        });

        it.each([false, true])(
            "[case] - does not acknowledge work finishing during shutdown, failing=%s",
            async (failing) => {
                // Arrange
                props.process.mockImplementation(() => {
                    service.onModuleDestroy();
                    return failing ? Promise.reject(transient) : Promise.resolve();
                });

                // Act
                const result = service.execute(props);

                // Assert
                await expect(result).rejects.toBeInstanceOf(KafkaRetriableException);
                expect(props.reject).not.toHaveBeenCalled();
                expect(metrics.recordRetry).not.toHaveBeenCalled();
            },
        );
    });

    describe("[Method] - wait", () => {
        it("[case] - does not wait or heartbeat when the deadline has passed", async () => {
            // Arrange

            // Act
            await service.wait({ heartbeat: props.heartbeat, deadline: -1 });

            // Assert
            expect(sleep).not.toHaveBeenCalled();
            expect(props.heartbeat).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - backoff", () => {
        it.each([
            [1, 1500],
            [2, 2500],
            [8, 2500],
        ])("[case] - caps exponential backoff before applying jitter for attempt %s", (attempt, expected) => {
            // Arrange

            // Act
            const result = service.backoff({ attempt });

            // Assert
            expect(result).toBe(expected);
        });
    });
});
