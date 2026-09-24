import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { HealthIndicatorService } from "@nestjs/terminus";

import { DatabaseHealthIndicator } from "./database.health";

function connection(): {
    isConnected: Jest.Mock<() => Promise<boolean>>;
    execute: Jest.Mock<(sql: string) => Promise<unknown>>;
} {
    return {
        isConnected: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
        execute: jest.fn<(sql: string) => Promise<unknown>>().mockResolvedValue([{ "?column?": 1 }]),
    };
}

describe("DatabaseHealthIndicator", () => {
    let write: ReturnType<typeof connection>;
    let read: ReturnType<typeof connection>;
    let indicator: DatabaseHealthIndicator;

    beforeEach(() => {
        write = connection();
        read = connection();
        indicator = new DatabaseHealthIndicator(
            { getConnection: () => write } as unknown as ORM.EntityManager,
            { getConnection: () => read } as unknown as ORM.EntityManager,
            new HealthIndicatorService(),
        );
    });

    it("checks both connections with SELECT 1 and preserves the indicator key", async () => {
        expect(await indicator.isHealthy("postgres")).toEqual({ postgres: { status: "up" } });
        for (const current of [write, read]) {
            expect(current.isConnected).toHaveBeenCalledTimes(1);
            expect(current.execute).toHaveBeenCalledWith("SELECT 1");
        }
    });

    it.each(["write", "read"])("reports a disconnected %s connection", async (kind) => {
        const current = kind === "write" ? write : read;
        current.isConnected.mockResolvedValue(false);
        expect(await indicator.isHealthy("database")).toEqual({
            database: { status: "down", message: "connection_lost" },
        });
        expect(current.execute).not.toHaveBeenCalled();
        if (kind === "write") {
            expect(read.isConnected).not.toHaveBeenCalled();
        }
    });

    it.each([new Error("driver failed"), "driver failed"])("normalizes driver errors: %s", async (error) => {
        read.execute.mockRejectedValue(error);
        expect(await indicator.isHealthy("database")).toEqual({
            database: { status: "down", message: "internal_driver_error" },
        });
    });

    it("handles failure while checking connection state", async () => {
        write.isConnected.mockRejectedValue(new Error("unavailable"));
        expect(await indicator.isHealthy("database")).toEqual({
            database: { status: "down", message: "internal_driver_error" },
        });
        expect(write.execute).not.toHaveBeenCalled();
        expect(read.isConnected).not.toHaveBeenCalled();
    });
});
