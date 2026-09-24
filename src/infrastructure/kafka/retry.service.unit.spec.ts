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

describe("KafkaRetryService", () => {
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

    it("heartbeats before processing a successful message", async () => {
        props.process.mockImplementation(() => {
            expect(props.heartbeat).toHaveBeenCalledTimes(1);
            return Promise.resolve();
        });
        await service.execute(props);
        expect(props.process).toHaveBeenCalledTimes(1);
        expect(props.reject).not.toHaveBeenCalled();
        expect(metrics.recordRetry).not.toHaveBeenCalled();
        expect(sleep).not.toHaveBeenCalled();
    });

    it("retries transient errors and heartbeats at most one second apart while waiting", async () => {
        props.process.mockRejectedValueOnce(transient);
        const result = service.execute(props);
        await jest.advanceTimersByTimeAsync(1499);
        expect(props.process).toHaveBeenCalledTimes(1);
        expect(props.heartbeat).toHaveBeenCalledTimes(2);
        await jest.advanceTimersByTimeAsync(1);
        await result;
        expect(props.process).toHaveBeenCalledTimes(2);
        expect(props.heartbeat).toHaveBeenCalledTimes(4);
        expect(sleep.mock.calls.map(([delay]) => delay)).toEqual([1000, 500]);
        expect(metrics.recordRetry.mock.calls).toEqual([[{ topic: "events", error: transient }]]);
        expect(props.reject).not.toHaveBeenCalled();
    });

    it("rejects after the configured number of retries", async () => {
        props.process.mockRejectedValue(transient);
        const result = service.execute(props);
        await jest.runAllTimersAsync();
        await result;
        expect(props.process).toHaveBeenCalledTimes(3);
        expect(metrics.recordRetry).toHaveBeenCalledTimes(2);
        expect(props.reject.mock.calls).toEqual([[transient]]);
        expect(metrics.recordDead).not.toHaveBeenCalled();
    });

    it("does not retry when the retry budget is zero", async () => {
        service = create(0);
        props.process.mockRejectedValue(transient);
        await service.execute(props);
        expect(props.process).toHaveBeenCalledTimes(1);
        expect(props.reject).toHaveBeenCalledWith(transient);
        expect(sleep).not.toHaveBeenCalled();
    });

    it.each([permanent, "unclassified"])("rejects permanent errors without waiting: %s", async (error) => {
        props.process.mockRejectedValue(error);
        await service.execute(props);
        expect(props.reject.mock.calls).toEqual([[error]]);
        expect(metrics.recordRetry).not.toHaveBeenCalled();
        expect(sleep).not.toHaveBeenCalled();
    });

    it("returns Kafka retry exceptions to the transport without local retry or rejection", async () => {
        props.process.mockRejectedValue(new KafkaRetriableException("transport retry"));
        await expect(service.execute(props)).rejects.toBeInstanceOf(KafkaRetriableException);
        expect(props.process).toHaveBeenCalledTimes(1);
        expect(props.reject).not.toHaveBeenCalled();
        expect(metrics.recordRetry).not.toHaveBeenCalled();
    });

    it.each([new Error("heartbeat failed"), "heartbeat failed"])("wraps heartbeat failures: %s", async (error) => {
        props.heartbeat.mockRejectedValue(error);
        await expect(service.execute(props)).rejects.toMatchObject({ message: "heartbeat failed" });
        expect(props.process).not.toHaveBeenCalled();
        expect(props.reject).not.toHaveBeenCalled();
    });

    it("propagates failure of the rejection handler to the transport", async () => {
        props.process.mockRejectedValue(permanent);
        props.reject.mockRejectedValue(new Error("dead topic unavailable"));
        await expect(service.execute(props)).rejects.toBeInstanceOf(KafkaRetriableException);
        expect(props.process).toHaveBeenCalledTimes(1);
    });

    it("aborts an active backoff without another attempt or rejection", async () => {
        props.process.mockRejectedValue(transient);
        const result = expect(service.execute(props)).rejects.toBeInstanceOf(KafkaRetriableException);
        await jest.advanceTimersByTimeAsync(0);
        expect(sleep).toHaveBeenCalledTimes(1);
        service.onModuleDestroy();
        await result;
        expect(sleep.mock.calls[0][2].signal.aborted).toBe(true);
        expect(jest.getTimerCount()).toBe(0);
        expect(props.process).toHaveBeenCalledTimes(1);
        expect(props.reject).not.toHaveBeenCalled();
    });

    it("does not start processing after shutdown", async () => {
        service.onModuleDestroy();
        await expect(service.execute(props)).rejects.toBeInstanceOf(KafkaRetriableException);
        expect(props.heartbeat).not.toHaveBeenCalled();
        expect(props.process).not.toHaveBeenCalled();
    });

    it.each([false, true])("does not acknowledge work finishing during shutdown, failing=%s", async (failing) => {
        props.process.mockImplementation(() => {
            service.onModuleDestroy();
            return failing ? Promise.reject(transient) : Promise.resolve();
        });
        await expect(service.execute(props)).rejects.toBeInstanceOf(KafkaRetriableException);
        expect(props.reject).not.toHaveBeenCalled();
        expect(metrics.recordRetry).not.toHaveBeenCalled();
    });

    it("does not wait or heartbeat when the deadline has passed", async () => {
        await service.wait({ heartbeat: props.heartbeat, deadline: -1 });
        expect(sleep).not.toHaveBeenCalled();
        expect(props.heartbeat).not.toHaveBeenCalled();
    });

    it.each([
        [1, 1500],
        [2, 2500],
        [8, 2500],
    ])("caps exponential backoff before applying jitter for attempt %s", (attempt, expected) => {
        expect(service.backoff({ attempt })).toBe(expected);
    });
});
