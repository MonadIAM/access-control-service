import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { HealthIndicatorService } from "@nestjs/terminus";
import Redis from "ioredis";

import { RedisHealthIndicator } from "./redis.health";

const kinds = ["cache", "limiter", "queue"] as const;

describe("RedisHealthIndicator", () => {
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

    it("reports up only after all three clients respond and preserves the indicator key", async () => {
        let resolve!: (value: string) => void;
        pings.cache.mockReturnValue(
            new Promise<string>((done) => {
                resolve = done;
            }),
        );
        let settled = false;
        const result = indicator.isHealthy("redis-cache").then((value) => {
            settled = true;
            return value;
        });
        for (const ping of Object.values(pings)) {
            expect(ping).toHaveBeenCalledTimes(1);
        }
        await Promise.resolve();
        expect(settled).toBe(false);
        resolve("PONG");
        expect(await result).toEqual({ "redis-cache": { status: "up" } });
    });

    it.each(kinds)("reports the responses when %s returns something other than PONG", async (kind) => {
        pings[kind].mockResolvedValue("unexpected");
        expect(await indicator.isHealthy("redis")).toEqual({
            redis: { status: "down", cache: "PONG", limiter: "PONG", queue: "PONG", [kind]: "unexpected" },
        });
    });

    it.each(kinds)("reports a rejected %s ping without skipping the other clients", async (kind) => {
        const error = new Error(`${kind} unavailable`);
        pings[kind].mockRejectedValue(error);
        expect(await indicator.isHealthy("redis")).toEqual({ redis: { status: "down", message: error } });
        for (const ping of Object.values(pings)) {
            expect(ping).toHaveBeenCalledTimes(1);
        }
    });

    it("handles non-Error rejection values", async () => {
        pings.queue.mockRejectedValue("connection closed");
        expect(await indicator.isHealthy("redis")).toEqual({ redis: { status: "down", message: "connection closed" } });
    });
});
