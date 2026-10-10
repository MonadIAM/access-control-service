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

describe("[InfrastructureService] - RedisLifecycle", () => {
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

    describe("[Method] - onApplicationShutdown", () => {
        it("[case] - quits every client without forcing disconnect", async () => {
            // Arrange

            // Act
            await lifecycle.onApplicationShutdown();

            // Assert
            for (const current of Object.values(clients)) {
                expect(current.quit).toHaveBeenCalledTimes(1);
                expect(current.disconnect).not.toHaveBeenCalled();
            }
            expect(Logger.prototype.warn).not.toHaveBeenCalled();
        });

        it.each(kinds)("[case] - forces only the failed %s connection to disconnect without reconnecting", async (kind) => {
            // Arrange
            clients[kind].quit.mockRejectedValue(new Error("quit failed"));

            // Act
            await lifecycle.onApplicationShutdown();

            // Assert
            for (const currentKind of kinds) {
                expect(clients[currentKind].quit).toHaveBeenCalledTimes(1);
                expect(clients[currentKind].disconnect.mock.calls).toEqual(currentKind === kind ? [[false]] : []);
            }
            expect(Logger.prototype.warn).toHaveBeenCalledWith(expect.stringContaining("quit failed"));
        });

        it("[case] - closes every connection even when all quit calls reject", async () => {
            // Arrange
            for (const current of Object.values(clients)) {
                current.quit.mockRejectedValue("connection closed");
            }

            // Act
            await lifecycle.onApplicationShutdown();

            // Assert
            for (const current of Object.values(clients)) {
                expect(current.disconnect.mock.calls).toEqual([[false]]);
            }
            expect(Logger.prototype.log).not.toHaveBeenCalled();
        });

        it("[case] - starts all quit calls concurrently and waits for the last one", async () => {
            // Arrange
            let resolve!: (value: string) => void;
            clients.cache.quit.mockReturnValue(
                new Promise<string>((done) => {
                    resolve = done;
                }),
            );
            let settled = false;

            // Act
            const result = lifecycle.onApplicationShutdown().then(() => {
                settled = true;
            });
            const callsBeforeCompletion = Object.values(clients).map((current) => current.quit.mock.calls.length);
            await Promise.resolve();
            const settledBeforeCompletion = settled;
            resolve("OK");
            await result;

            // Assert
            expect(callsBeforeCompletion).toEqual([1, 1, 1]);
            expect(settledBeforeCompletion).toBe(false);
            expect(settled).toBe(true);
        });
    });
});
