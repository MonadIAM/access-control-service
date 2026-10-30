import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";
import { ReauthenticationMethod } from "~context/enums";

@Injectable()
export class ReauthenticationCacheService implements InfrastructureServices.ReauthenticationCache.Contract {
    private readonly namespace = "reauthentication";

    public constructor(@Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis) {}

    public async set(
        props: InfrastructureServices.ReauthenticationCache.Set.Props,
    ): InfrastructureServices.ReauthenticationCache.Set.Result {
        const { session, ttl, proof } = props;
        await this.redis.set(`${this.namespace}:${session}`, "1", "EX", ttl);

        if (proof) {
            await this.redis.set(`${this.namespace}:${session}:${proof.method}`, JSON.stringify(proof), "EX", ttl);
        }
    }

    public async exists(
        props: InfrastructureServices.ReauthenticationCache.Exists.Props,
    ): InfrastructureServices.ReauthenticationCache.Exists.Result {
        const { session, methods } = props;
        const keys = methods?.length
            ? methods.map((method) => `${this.namespace}:${session}:${method}`)
            : [`${this.namespace}:${session}`];

        return (await this.redis.exists(...keys)) > 0;
    }

    public async get(
        props: InfrastructureServices.ReauthenticationCache.Get.Props,
    ): InfrastructureServices.ReauthenticationCache.Get.Result {
        const { session, method } = props;
        const raw = await this.redis.get(`${this.namespace}:${session}:${method}`);

        return raw ? JSON.parse(raw) : null;
    }

    public async delete(
        props: InfrastructureServices.ReauthenticationCache.Delete.Props,
    ): InfrastructureServices.ReauthenticationCache.Delete.Result {
        const { session } = props;
        const keys = Object.values(ReauthenticationMethod).map((method) => `${this.namespace}:${session}:${method}`);

        await this.redis.unlink(`${this.namespace}:${session}`, ...keys);
    }
}
