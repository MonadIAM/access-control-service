import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { HealthIndicatorService } from "@nestjs/terminus";
import { MikroORM } from "@mikro-orm/postgresql";

import { PostgresResource } from "~testing/integration/containers/postgres.resource";

import { DatabaseHealthIndicator } from "./database.health";
import { PostgreSQLPoolRegistry } from "./pool.registry";
import { MikroOrmConfig } from "./database.config";

describe("Database infrastructure with PostgreSQL", () => {
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

    it("connects with production options and registers the actual driver pools", async () => {
        expect(await health.isHealthy("database")).toEqual({ database: { status: "up" } });
        expect(registry.snapshots()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ kind: "write", max: 3, total: expect.any(Number) }),
                expect.objectContaining({ kind: "read", max: 2, total: expect.any(Number) }),
            ]),
        );
        expect(registry.snapshots()).toHaveLength(2);
        for (const snapshot of registry.snapshots()) {
            expect(snapshot.total).toBeGreaterThan(0);
            expect(snapshot.active).toBe(0);
        }
    });

    it("reports a closed read connection as down and returns up after reconnecting", async () => {
        await read!.close(true);
        expect(await health.isHealthy("database")).toEqual({ database: { status: "down", message: "connection_lost" } });
        await read!.reconnect();
        expect(await health.isHealthy("database")).toEqual({ database: { status: "up" } });
        expect(registry.snapshot({ kind: "read" })?.total).toBeGreaterThan(0);
    });
});
