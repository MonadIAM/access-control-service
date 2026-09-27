import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import Redis from "ioredis";

import { RedisLifecycle } from "./redis.lifecycle";

function client(): { quit: Jest.Mock<() => Promise<string>>; disconnect: Jest.Mock<(reconnect: boolean) => void> } {
    return {
        quit: jest.fn<() => Promise<string>>().mockResolvedValue("OK"),
        disconnect: jest.fn<(reconnect: boolean) => void>(),
    };
}

const kinds = ["cache", "limiter", "queue"] as const;

describe("RedisLifecycle", () => {
    let clients: Record<(typeof kinds)[number], ReturnType<typeof client>>;
    let lifecycle: RedisLifecycle;

    beforeEach(() => {
        jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
        jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
        clients = { cache: client(), limiter: client(), queue: client() };
        lifecycle = new RedisLifecycle(
            clients.cache as unknown as Redis,
            clients.limiter as unknown as Redis,
            clients.queue as unknown as Redis,
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("onApplicationShutdown", () => {
        it("gracefully quits every client without forcing disconnect", async () => {
            await lifecycle.onApplicationShutdown();
            for (const current of Object.values(clients)) {
                expect(current.quit).toHaveBeenCalledTimes(1);
                expect(current.disconnect).not.toHaveBeenCalled();
            }
            expect(Logger.prototype.warn).not.toHaveBeenCalled();
        });

        it.each(kinds)("forces only the failed %s connection to disconnect without reconnecting", async (kind) => {
            clients[kind].quit.mockRejectedValue(new Error("quit failed"));
            await lifecycle.onApplicationShutdown();
            for (const currentKind of kinds) {
                expect(clients[currentKind].quit).toHaveBeenCalledTimes(1);
                expect(clients[currentKind].disconnect.mock.calls).toEqual(currentKind === kind ? [[false]] : []);
            }
            expect(Logger.prototype.warn).toHaveBeenCalledWith(expect.stringContaining("quit failed"));
        });

        it("closes every connection even when all quit calls reject", async () => {
            for (const current of Object.values(clients)) {
                current.quit.mockRejectedValue("connection closed");
            }
            await lifecycle.onApplicationShutdown();
            for (const current of Object.values(clients)) {
                expect(current.disconnect.mock.calls).toEqual([[false]]);
            }
            expect(Logger.prototype.log).not.toHaveBeenCalled();
        });

        it("starts all quit calls concurrently and waits for the last one", async () => {
            let resolve!: (value: string) => void;
            clients.cache.quit.mockReturnValue(
                new Promise<string>((done) => {
                    resolve = done;
                }),
            );
            let settled = false;
            const result = lifecycle.onApplicationShutdown().then(() => {
                settled = true;
            });
            for (const current of Object.values(clients)) {
                expect(current.quit).toHaveBeenCalledTimes(1);
            }
            await Promise.resolve();
            expect(settled).toBe(false);
            resolve("OK");
            await result;
            expect(settled).toBe(true);
        });
    });
});
