import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT, REDIS_LIMITER_CLIENT, REDIS_QUEUE_CLIENT } from "./tokens";
import { RedisConnectionRegistry } from "./connection.registry";
import { RedisLifecycle } from "./redis.lifecycle";
import { RedisConfig } from "./redis.config";

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CACHE_CLIENT,
            inject: [ConfigService, RedisConnectionRegistry],
            useFactory: (config: ConfigService, registry: RedisConnection.Registry.InternalContract) => {
                const client = new Redis(RedisConfig.buildCacheOptions(config));
                registry.register({ kind: "cache", client });
                return client;
            },
        },
        {
            provide: REDIS_LIMITER_CLIENT,
            inject: [ConfigService, RedisConnectionRegistry],
            useFactory: (config: ConfigService, registry: RedisConnection.Registry.InternalContract) => {
                const client = new Redis(RedisConfig.buildLimiterOptions(config));
                registry.register({ kind: "limiter", client });
                return client;
            },
        },
        {
            provide: REDIS_QUEUE_CLIENT,
            inject: [ConfigService, RedisConnectionRegistry],
            useFactory: (config: ConfigService, registry: RedisConnection.Registry.InternalContract) => {
                const client = new Redis(RedisConfig.buildQueueOptions(config));
                registry.register({ kind: "queue", client });
                return client;
            },
        },
        RedisConnectionRegistry,
        RedisLifecycle,
    ],
    exports: [REDIS_CACHE_CLIENT, REDIS_LIMITER_CLIENT, REDIS_QUEUE_CLIENT, RedisConnectionRegistry],
})
export class RedisModule {}
