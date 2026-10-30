import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { Global, INestApplicationContext, Module } from "@nestjs/common";
import { HealthIndicatorService } from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import Redis from "ioredis";

import { ReauthenticationCacheService } from "~context/infrastructure/services/reauthentication-cache.service";
import { RedisResource } from "~testing/integration/containers/redis.resource";
import { ReauthenticationMethod } from "~context/enums";

import { REDIS_CACHE_CLIENT, REDIS_LIMITER_CLIENT, REDIS_QUEUE_CLIENT } from "./tokens";
import { RedisConnectionRegistry } from "./connection.registry";
import { RedisHealthIndicator } from "./redis.health";
import { RedisModule } from "./redis.module";

@Global()
@Module({ providers: [{ provide: ConfigService, useFactory: () => RedisResource.config() }], exports: [ConfigService] })
class TestConfigModule {}

@Module({
    imports: [TestConfigModule, RedisModule],
    providers: [HealthIndicatorService, RedisHealthIndicator, ReauthenticationCacheService],
})
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

    describe("[Behavior] - reauthentication proofs", () => {
        let cache: ReauthenticationCacheService;
        let session: string;

        beforeEach(() => {
            cache = app!.get(ReauthenticationCacheService);
            session = randomUUID();
        });

        afterEach(async () => {
            await cache.delete({ session });
        });

        it("[case] - accepts a legacy grant only for unrestricted checks", async () => {
            // Arrange
            await cache.set({ session, ttl: 60 });

            // Act
            const result = await cache.exists({ session });
            const result2 = await cache.exists({ session, methods: [] });
            const result3 = await cache.exists({ session, methods: Object.values(ReauthenticationMethod) });
            const result4 = await cache.get({ session, method: ReauthenticationMethod.TOTP });

            // Assert
            expect(result).toBe(true);
            expect(result2).toBe(true);
            expect(result3).toBe(false);
            expect(result4).toBeNull();
        });

        it("[case] - restricts password proofs by method and session", async () => {
            // Arrange
            await cache.set({ session, ttl: 60, proof: { method: ReauthenticationMethod.PASSWORD } });

            // Act
            const result = await cache.exists({ session, methods: [ReauthenticationMethod.TOTP] });
            const result2 = await cache.exists({
                session,
                methods: [ReauthenticationMethod.TOTP, ReauthenticationMethod.PASSWORD],
            });
            const result3 = await cache.exists({ session: randomUUID(), methods: [ReauthenticationMethod.PASSWORD] });

            // Assert
            expect(result).toBe(false);
            expect(result2).toBe(true);
            expect(result3).toBe(false);
        });

        it("[case] - retains the verified factor when another method or a legacy event grants access", async () => {
            // Arrange
            const proof: InfrastructureServices.ReauthenticationCache.Proof = {
                method: ReauthenticationMethod.TOTP,
                factor: randomUUID(),
            };
            await cache.set({ session, ttl: 60, proof });

            // Act
            await cache.set({ session, ttl: 60, proof: { method: ReauthenticationMethod.PASSWORD } });
            await cache.set({ session, ttl: 60 });
            const result = await cache.get({ session, method: ReauthenticationMethod.TOTP });
            const result2 = await cache.exists({ session, methods: [ReauthenticationMethod.TOTP] });

            // Assert
            expect(result).toEqual(proof);
            expect(result2).toBe(true);
        });

        it("[case] - does not extend a TOTP proof when password reauthentication renews the general grant", async () => {
            // Arrange
            await cache.set({
                session,
                ttl: 60,
                proof: { method: ReauthenticationMethod.TOTP, factor: randomUUID() },
            });
            const key = `reauthentication:${session}:${ReauthenticationMethod.TOTP}`;
            await clients[0].pexpire(key, 10000);

            // Act
            await cache.set({ session, ttl: 60, proof: { method: ReauthenticationMethod.PASSWORD } });
            await cache.set({ session, ttl: 60 });
            const result = await clients[0].pttl(key);
            await clients[0].pexpire(key, 0);
            const result2 = await cache.exists({ session, methods: [ReauthenticationMethod.TOTP] });
            const result3 = await cache.exists({ session, methods: [ReauthenticationMethod.PASSWORD] });
            const result4 = await cache.get({ session, method: ReauthenticationMethod.TOTP });

            // Assert
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThanOrEqual(10000);
            expect(result2).toBe(false);
            expect(result3).toBe(true);
            expect(result4).toBeNull();
        });

        it("[case] - expires every proof and deletes all methods together with the general grant", async () => {
            // Arrange
            await cache.set({ session, ttl: 60, proof: { method: ReauthenticationMethod.PASSWORD } });
            await cache.set({ session, ttl: 60, proof: { method: ReauthenticationMethod.OTP } });
            await cache.set({
                session,
                ttl: 60,
                proof: { method: ReauthenticationMethod.TOTP, factor: randomUUID() },
            });
            const methods = Object.values(ReauthenticationMethod);
            const keys = [
                `reauthentication:${session}`,
                ...methods.map((method) => `reauthentication:${session}:${method}`),
            ];

            // Act
            const result = await Promise.all(keys.map((key) => clients[0].ttl(key)));
            await cache.delete({ session });
            const result2 = await cache.exists({ session });
            const result3 = await cache.exists({ session, methods });
            const result4 = await Promise.all(methods.map((method) => cache.get({ session, method })));

            // Assert
            expect(result.every((ttl) => ttl > 0 && ttl <= 60)).toBe(true);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
            expect(result4).toEqual([null, null, null]);
        });
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
