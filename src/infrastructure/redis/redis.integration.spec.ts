import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { Global, INestApplicationContext, Module } from "@nestjs/common";
import { HealthIndicatorService } from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import Redis from "ioredis";

import { RedisResource } from "~testing/integration/containers/redis.resource";

import { REDIS_CACHE_CLIENT, REDIS_LIMITER_CLIENT, REDIS_QUEUE_CLIENT } from "./tokens";
import { RedisConnectionRegistry } from "./connection.registry";
import { RedisHealthIndicator } from "./redis.health";
import { RedisModule } from "./redis.module";

@Global()
@Module({ providers: [{ provide: ConfigService, useFactory: () => RedisResource.config() }], exports: [ConfigService] })
class TestConfigModule {}

@Module({ imports: [TestConfigModule, RedisModule], providers: [HealthIndicatorService, RedisHealthIndicator] })
class TestRedisModule {}

describe("Redis infrastructure with Redis", () => {
    let app: Optional<INestApplicationContext>;
    let clients: Redis[];

    beforeEach(async () => {
        app = await NestFactory.createApplicationContext(TestRedisModule, { logger: false, abortOnError: false });
        clients = [REDIS_CACHE_CLIENT, REDIS_LIMITER_CLIENT, REDIS_QUEUE_CLIENT].map((token) => app!.get<Redis>(token));
        await Promise.all(clients.map((client) => client.ping()));
    });

    afterEach(async () => {
        await app?.close();
        app = undefined;
    });

    describe("client connections", () => {
        it("authenticates production clients and isolates cache, limiter and queue databases", async () => {
            const key = `integration:${randomUUID()}`;
            try {
                await Promise.all(clients.map((client, index) => client.set(key, `value-${index}`)));
                expect(await Promise.all(clients.map((client) => client.get(key)))).toEqual([
                    "value-0",
                    "value-1",
                    "value-2",
                ]);
                expect(await app!.get(RedisHealthIndicator).isHealthy("redis")).toEqual({ redis: { status: "up" } });
                expect(app!.get(RedisConnectionRegistry).snapshots()).toEqual([
                    { kind: "cache", status: "ready", connected: true, ready: true },
                    { kind: "limiter", status: "ready", connected: true, ready: true },
                    { kind: "queue", status: "ready", connected: true, ready: true },
                ]);
            } finally {
                await Promise.all(clients.map((client) => client.del(key)));
            }
        });
    });

    describe("isHealthy", () => {
        it("reports a disconnected dependency and recovers after reconnection", async () => {
            await clients[0].quit();
            expect(await app!.get(RedisHealthIndicator).isHealthy("redis")).toMatchObject({ redis: { status: "down" } });
            await clients[0].connect();
            expect(await app!.get(RedisHealthIndicator).isHealthy("redis")).toEqual({ redis: { status: "up" } });
        });
    });

    describe("onApplicationShutdown", () => {
        it("runs the registered shutdown hook and closes all client connections", async () => {
            const ended = Promise.all(clients.map((client) => once(client, "end", { signal: AbortSignal.timeout(5000) })));
            await app!.close();
            await ended;
            app = undefined;
            expect(clients.map((client) => client.status)).toEqual(["end", "end", "end"]);
            await Promise.all(clients.map((client) => expect(client.ping()).rejects.toThrow()));
        });
    });
});
