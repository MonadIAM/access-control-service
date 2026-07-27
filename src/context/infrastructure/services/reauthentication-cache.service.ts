import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";

@Injectable()
export class ReauthenticationCacheService implements InfrastructureServices.ReauthenticationCache.Contract {
    private readonly namespace = "reauthentication";

    public constructor(@Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis) {}

    public async set({ session, ttl }: InfrastructureServices.ReauthenticationCache.Set): Promise<void> {
        await this.redis.set(`${this.namespace}:${session}`, "1", "EX", ttl);
    }

    public async exists({ session }: InfrastructureServices.ReauthenticationCache.Exists): Promise<boolean> {
        return (await this.redis.exists(`${this.namespace}:${session}`)) === 1;
    }

    public async delete({ session }: InfrastructureServices.ReauthenticationCache.Delete): Promise<void> {
        await this.redis.unlink(`${this.namespace}:${session}`);
    }
}
