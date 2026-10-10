import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { HealthIndicatorService } from "@nestjs/terminus";
import { MikroORM } from "@mikro-orm/postgresql";

import { PostgresResource } from "~testing/integration/containers/postgres.resource";

import { DatabaseHealthIndicator } from "./database.health";
import { PostgreSQLPoolRegistry } from "./pool.registry";
import { MikroOrmConfig } from "./database.config";

describe("[Infrastructure] - Database", () => {
    let write: Optional<MikroORM>;
    let read: Optional<MikroORM>;
    let registry: PostgreSQLPoolRegistry;
    let health: DatabaseHealthIndicator;

    beforeEach(async () => {
        registry = new PostgreSQLPoolRegistry();
        const builder = new MikroOrmConfig(registry);
        const config = PostgresResource.config();
        write = await MikroORM.init({ ...builder.buildOptions({ config, kind: "write" }), debug: false });
        read = await MikroORM.init({ ...builder.buildOptions({ config, kind: "read" }), debug: false });
        await Promise.all([write.connect(), read.connect()]);
        health = new DatabaseHealthIndicator(write.em, read.em, new HealthIndicatorService());
    });

    afterEach(async () => {
        await Promise.all([write?.close(true), read?.close(true)]);
        write = undefined;
        read = undefined;
    });

    describe("[Method] - isHealthy", () => {
        it("[case] - connects with production options and registers the actual driver pools", async () => {
            // Arrange

            // Act
            const result = await health.isHealthy("database");
            const result2 = registry.snapshots();
            const result3 = registry.snapshots();

            // Assert
            expect(result).toEqual({ database: { status: "up" } });
            expect(result2).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ kind: "write", max: 3, total: expect.any(Number) }),
                    expect.objectContaining({ kind: "read", max: 2, total: expect.any(Number) }),
                ]),
            );
            expect(result3).toHaveLength(2);
            for (const snapshot of registry.snapshots()) {
                expect(snapshot.total).toBeGreaterThan(0);
                expect(snapshot.active).toBe(0);
            }
        });

        it("[case] - reports a closed read connection as down and returns up after reconnecting", async () => {
            // Arrange
            await read!.close(true);

            // Act
            const result = await health.isHealthy("database");
            await read!.reconnect();
            const result2 = await health.isHealthy("database");

            const result1 = registry.snapshot({ kind: "read" })?.total;

            // Assert
            expect(result).toEqual({
                database: { status: "down", message: "connection_lost" },
            });
            expect(result2).toEqual({ database: { status: "up" } });
            expect(result1).toBeGreaterThan(0);
        });
    });
});
