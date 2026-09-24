import { ConfigService } from "@nestjs/config";
import { RedisOptions } from "bullmq";
import { readFileSync } from "fs";

export class RedisConfig {
    private constructor() {}

    private static getBaseOptions(config: ConfigService): RedisOptions {
        return {
            ...this.buildTlsOptions(config),
            password: config.getOrThrow<string>("REDIS_PASSWORD"),
            port: config.getOrThrow<number>("REDIS_PORT"),
            host: config.getOrThrow<string>("REDIS_HOST"),
            enableAutoPipelining: true,
            lazyConnect: true,
            retryStrategy: (attempt): number => {
                return Math.min(100 * Math.pow(2, attempt), 2000);
            },
            reconnectOnError: (error: Error): boolean => {
                const message = error.message.toLowerCase();
                return message.includes("read only") || message.includes("readonly") || message.includes("econnreset");
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

    private static buildTlsOptions(config: ConfigService): Pick<RedisOptions, "tls"> {
        if (config.get<boolean>("REDIS_TLS_ENABLED")) {
            const rejectUnauthorized = config.getOrThrow<boolean>("REDIS_TLS_REJECT_UNAUTHORIZED");
            const servername = config.getOrThrow<string>("REDIS_HOST");

            const cert = readFileSync(config.getOrThrow<string>("REDIS_TLS_CERT_FILE"), "utf8");
            const key = readFileSync(config.getOrThrow<string>("REDIS_TLS_KEY_FILE"), "utf8");
            const ca = readFileSync(config.getOrThrow<string>("REDIS_TLS_CA_FILE"), "utf8");

            return { tls: { rejectUnauthorized, servername, cert, key, ca } };
        } else {
            return {};
        }
    }
}
