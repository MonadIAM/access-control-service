import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT, REDIS_LIMITER_CLIENT, REDIS_QUEUE_CLIENT } from "./tokens";
import { RedisLifecycle } from "./redis.lifecycle";
import { RedisConfig } from "./redis.config";

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CACHE_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => new Redis(RedisConfig.buildCacheOptions(config)),
        },
        {
            provide: REDIS_LIMITER_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => new Redis(RedisConfig.buildLimiterOptions(config)),
        },
        {
            provide: REDIS_QUEUE_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => new Redis(RedisConfig.buildQueueOptions(config)),
        },
        RedisLifecycle,
    ],
    exports: [REDIS_CACHE_CLIENT, REDIS_LIMITER_CLIENT, REDIS_QUEUE_CLIENT],
})
export class RedisModule {}
