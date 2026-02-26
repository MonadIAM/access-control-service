import { ConfigService } from "@nestjs/config";
import { RedisOptions } from "ioredis";

export class RedisConfig {
    private constructor() {}

    private static getBaseOptions(config: ConfigService): RedisOptions {
        return {
            port: +config.getOrThrow<number>("REDIS_PORT"),
            host: config.getOrThrow<string>("REDIS_HOST"),
            password: config.getOrThrow<string>("REDIS_PASSWORD"),
            lazyConnect: true,
            enableAutoPipelining: true,
            retryStrategy: (attempt): number => {
                return Math.min(100 * Math.pow(2, attempt), 2000);
            },
            reconnectOnError: (error): boolean => {
                const message = error.message.toLowerCase();
                return message.includes("read only") ?? message.includes("econnreset");
            },
        };
    }

    public static buildCacheOptions(config: ConfigService): RedisOptions {
        return {
            ...this.getBaseOptions(config),
            db: config.getOrThrow<number>("REDIS_DB_CACHE"),
            maxRetriesPerRequest: 20,
        };
    }

    public static buildLimiterOptions(config: ConfigService): RedisOptions {
        return {
            ...this.getBaseOptions(config),
            db: config.getOrThrow<number>("REDIS_DB_LIMITER") ?? 1,
            maxRetriesPerRequest: 5,
        };
    }

    public static buildQueueOptions(config: ConfigService): RedisOptions {
        return {
            ...this.getBaseOptions(config),
            db: config.getOrThrow<number>("REDIS_DB_QUEUE"),
            maxRetriesPerRequest: null,
        };
    }
}
