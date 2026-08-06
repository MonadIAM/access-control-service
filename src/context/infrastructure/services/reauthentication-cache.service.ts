import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";

@Injectable()
export class ReauthenticationCacheService implements InfrastructureServices.ReauthenticationCache.Contract {
    private readonly namespace = "reauthentication";

    public constructor(@Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis) {}

    public async set(
        props: InfrastructureServices.ReauthenticationCache.Set.Props,
    ): InfrastructureServices.ReauthenticationCache.Set.Result {
        const { session, ttl } = props;
        await this.redis.set(`${this.namespace}:${session}`, "1", "EX", ttl);
    }

    public async exists(
        props: InfrastructureServices.ReauthenticationCache.Exists.Props,
    ): InfrastructureServices.ReauthenticationCache.Exists.Result {
        const { session } = props;
        return (await this.redis.exists(`${this.namespace}:${session}`)) === 1;
    }

    public async delete(
        props: InfrastructureServices.ReauthenticationCache.Delete.Props,
    ): InfrastructureServices.ReauthenticationCache.Delete.Result {
        const { session } = props;
        await this.redis.unlink(`${this.namespace}:${session}`);
    }
}
