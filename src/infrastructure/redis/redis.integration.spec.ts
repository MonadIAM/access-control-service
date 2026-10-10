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

describe("[Infrastructure] - Redis", () => {
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

    describe("[Behavior] - client connections", () => {
        it("[case] - authenticates production clients and isolates cache, limiter and queue databases", async () => {
            // Arrange
            const key = `integration:${randomUUID()}`;

            // Act
            const [values, health, connections] = await Promise.all(
                clients.map((client, index) => client.set(key, `value-${index}`)),
            )
                .then(async () => {
                    const values = await Promise.all(clients.map((client) => client.get(key)));
                    const health = await app!.get(RedisHealthIndicator).isHealthy("redis");
                    const connections = app!.get(RedisConnectionRegistry).snapshots();
                    return [values, health, connections] as const;
                })
                .finally(() => Promise.all(clients.map((client) => client.del(key))));

            // Assert
            expect(values).toEqual(["value-0", "value-1", "value-2"]);
            expect(health).toEqual({ redis: { status: "up" } });
            expect(connections).toEqual([
                { kind: "cache", status: "ready", connected: true, ready: true },
                { kind: "limiter", status: "ready", connected: true, ready: true },
                { kind: "queue", status: "ready", connected: true, ready: true },
            ]);
        });
    });

    describe("[Method] - isHealthy", () => {
        it("[case] - reports a disconnected dependency and recovers after reconnection", async () => {
            // Arrange
            await clients[0].quit();

            // Act
            const result = await app!.get(RedisHealthIndicator).isHealthy("redis");
            await clients[0].connect();
            const result2 = await app!.get(RedisHealthIndicator).isHealthy("redis");

            // Assert
            expect(result).toMatchObject({ redis: { status: "down" } });
            expect(result2).toEqual({ redis: { status: "up" } });
        });
    });

    describe("[Method] - onApplicationShutdown", () => {
        it("[case] - runs the registered shutdown hook and closes all client connections", async () => {
            // Arrange
            const ended = Promise.all(clients.map((client) => once(client, "end", { signal: AbortSignal.timeout(5000) })));
            await app!.close();
            await ended;

            // Act
            app = undefined;
            const pings = clients.map((client) => client.ping());
            await Promise.allSettled(pings);

            // Assert
            expect(clients.map((client) => client.status)).toEqual(["end", "end", "end"]);
            await Promise.all(pings.map((ping) => expect(ping).rejects.toThrow()));
        });
    });
});
