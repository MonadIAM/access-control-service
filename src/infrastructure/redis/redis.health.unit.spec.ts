import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { HealthIndicatorService } from "@nestjs/terminus";
import Redis from "ioredis";

import { RedisHealthIndicator } from "./redis.health";

const kinds = ["cache", "limiter", "queue"] as const;

describe("[HealthIndicator] - Redis", () => {
    let pings: Record<(typeof kinds)[number], Jest.Mock<() => Promise<string>>>;
    let indicator: RedisHealthIndicator;

    beforeEach(() => {
        pings = {
            cache: jest.fn<() => Promise<string>>().mockResolvedValue("PONG"),
            limiter: jest.fn<() => Promise<string>>().mockResolvedValue("PONG"),
            queue: jest.fn<() => Promise<string>>().mockResolvedValue("PONG"),
        };
        indicator = new RedisHealthIndicator(
            new HealthIndicatorService(),
            { ping: pings.limiter } as unknown as Redis,
            { ping: pings.cache } as unknown as Redis,
            { ping: pings.queue } as unknown as Redis,
        );
    });

    describe("[Method] - isHealthy", () => {
        it("[case] - reports up only after all three clients respond and preserves the indicator key", async () => {
            // Arrange
            let resolve!: (value: string) => void;
            pings.cache.mockReturnValue(
                new Promise<string>((done) => {
                    resolve = done;
                }),
            );
            let settled = false;

            // Act
            const result = indicator.isHealthy("redis-cache").then((value) => {
                settled = true;
                return value;
            });
            const callsBeforeCompletion = Object.values(pings).map((ping) => ping.mock.calls.length);
            await Promise.resolve();
            const settledBeforeCompletion = settled;
            resolve("PONG");
            const result2 = await result;

            // Assert
            expect(callsBeforeCompletion).toEqual([1, 1, 1]);
            expect(settledBeforeCompletion).toBe(false);
            expect(result2).toEqual({ "redis-cache": { status: "up" } });
        });

        it.each(kinds)("[case] - reports the responses when %s returns something other than PONG", async (kind) => {
            // Arrange
            pings[kind].mockResolvedValue("unexpected");

            // Act
            const result = await indicator.isHealthy("redis");

            // Assert
            expect(result).toEqual({
                redis: { status: "down", cache: "PONG", limiter: "PONG", queue: "PONG", [kind]: "unexpected" },
            });
        });

        it.each(kinds)("[case] - reports a rejected %s ping without skipping the other clients", async (kind) => {
            // Arrange
            const error = new Error(`${kind} unavailable`);
            pings[kind].mockRejectedValue(error);

            // Act
            const result = await indicator.isHealthy("redis");

            // Assert
            expect(result).toEqual({ redis: { status: "down", message: error } });
            for (const ping of Object.values(pings)) {
                expect(ping).toHaveBeenCalledTimes(1);
            }
        });

        it("[case] - handles non-Error rejection values", async () => {
            // Arrange
            pings.queue.mockRejectedValue("connection closed");

            // Act
            const result = await indicator.isHealthy("redis");

            // Assert
            expect(result).toEqual({ redis: { status: "down", message: "connection closed" } });
        });
    });
});
