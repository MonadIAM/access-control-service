import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/tokens";

@Injectable()
export class ElevatedAccessCacheService implements InfrastructureServices.ElevatedAccessCache.Contract {
    private readonly namespace = "elevated-access";

    public constructor(@Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis) {}

    public async set({ session, ttl }: InfrastructureServices.ElevatedAccessCache.Set): Promise<void> {
        await this.redis.set(`${this.namespace}:${session}`, "1", "EX", ttl);
    }

    public async exists({ session }: InfrastructureServices.ElevatedAccessCache.Exists): Promise<boolean> {
        return (await this.redis.exists(`${this.namespace}:${session}`)) === 1;
    }

    public async delete({ session }: InfrastructureServices.ElevatedAccessCache.Delete): Promise<void> {
        await this.redis.unlink(`${this.namespace}:${session}`);
    }
}
