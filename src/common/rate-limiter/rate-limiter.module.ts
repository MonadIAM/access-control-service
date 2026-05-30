import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Module, Global } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import ms, { StringValue } from "ms";
import { Redis } from "ioredis";

import { RedisModule, REDIS_LIMITER_CLIENT } from "~infrastructure/redis";

@Global()
@Module({
    imports: [
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule, RedisModule],
            inject: [ConfigService, REDIS_LIMITER_CLIENT],
            useFactory: (configService: ConfigService, limiterClient: Redis) => ({
                throttlers: [
                    {
                        ttl: ms(configService.getOrThrow<StringValue>("THROTTLE_TTL")),
                        limit: configService.getOrThrow<number>("THROTTLE_LIMIT"),
                        name: "default",
                    },
                ],
                storage: new ThrottlerStorageRedisService(limiterClient),
                errorMessage: "global.throttle",
            }),
        }),
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class RateLimiterModule {}
