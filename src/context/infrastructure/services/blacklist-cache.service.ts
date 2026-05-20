import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/tokens";

@Injectable()
export class BlacklistCacheService implements InfrastructureServices.BlacklistCache.Contract {
    private readonly namespace = "blacklist";

    public constructor(@Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis) {}

    public async set({ sessionId, ttl }: InfrastructureServices.BlacklistCache.Set): Promise<void> {
        await this.redis.set(`${this.namespace}:${sessionId}`, "1", "EX", ttl);
    }

    public async exists({ sessionId }: InfrastructureServices.BlacklistCache.Exists): Promise<boolean> {
        return (await this.redis.exists(`${this.namespace}:${sessionId}`)) === 1;
    }
}
