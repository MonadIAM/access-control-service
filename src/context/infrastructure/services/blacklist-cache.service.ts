import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";

@Injectable()
export class BlacklistCacheService implements InfrastructureServices.BlacklistCache.Contract {
    private readonly namespace = "blacklist";

    public constructor(@Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis) {}

    public async set(
        props: InfrastructureServices.BlacklistCache.Set.Props,
    ): InfrastructureServices.BlacklistCache.Set.Result {
        const { session, ttl } = props;
        await this.redis.set(`${this.namespace}:${session}`, "1", "EX", ttl);
    }

    public async exists(
        props: InfrastructureServices.BlacklistCache.Exists.Props,
    ): InfrastructureServices.BlacklistCache.Exists.Result {
        const { session } = props;
        return (await this.redis.exists(`${this.namespace}:${session}`)) === 1;
    }
}
