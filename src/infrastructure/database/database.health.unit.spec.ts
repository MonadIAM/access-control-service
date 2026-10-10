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

describe("[HealthIndicator] - Database", () => {
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

    describe("[Method] - isHealthy", () => {
        it("[case] - checks both connections with SELECT 1 and preserves the indicator key", async () => {
            // Arrange

            // Act
            const result = await indicator.isHealthy("postgres");

            // Assert
            expect(result).toEqual({ postgres: { status: "up" } });
            for (const current of [write, read]) {
                expect(current.isConnected).toHaveBeenCalledTimes(1);
                expect(current.execute).toHaveBeenCalledWith("SELECT 1");
            }
        });

        it.each(["write", "read"])("[case] - reports a disconnected %s connection", async (kind) => {
            // Arrange
            const current = kind === "write" ? write : read;
            current.isConnected.mockResolvedValue(false);

            // Act
            const result = await indicator.isHealthy("database");

            // Assert
            expect(result).toEqual({
                database: { status: "down", message: "connection_lost" },
            });
            expect(current.execute).not.toHaveBeenCalled();
            if (kind === "write") {
                expect(read.isConnected).not.toHaveBeenCalled();
            }
        });

        it.each([
            { label: "Error", value: new Error("driver failed") },
            { label: "string", value: "driver failed" },
        ])("[case] - normalizes driver errors ($label)", async ({ value: error }) => {
            // Arrange
            read.execute.mockRejectedValue(error);

            // Act
            const result = await indicator.isHealthy("database");

            // Assert
            expect(result).toEqual({
                database: { status: "down", message: "internal_driver_error" },
            });
        });

        it("[case] - handles failure while checking connection state", async () => {
            // Arrange
            write.isConnected.mockRejectedValue(new Error("unavailable"));

            // Act
            const result = await indicator.isHealthy("database");

            // Assert
            expect(result).toEqual({
                database: { status: "down", message: "internal_driver_error" },
            });
            expect(write.execute).not.toHaveBeenCalled();
            expect(read.isConnected).not.toHaveBeenCalled();
        });
    });
});
