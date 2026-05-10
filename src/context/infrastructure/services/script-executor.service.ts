import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/redis.tokens";

import { SCRIPT_LOADER_SERVICE } from "./tokens";
import { ProjectionScript } from "../scripts";

@Injectable()
export class ScriptExecutorService {
    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
        @Inject(SCRIPT_LOADER_SERVICE)
        private readonly scriptLoaderServices: InfrastructureServices.ScriptLoader.Contract,
    ) {}

    public async execute<T>(script: ProjectionScript, keys: string[], args: string[]): Promise<T> {
        const hash = this.scriptLoaderServices.getHash(script);
        return (await this.redis.evalsha(hash, keys.length, ...keys, ...args)) as T;
    }
}
