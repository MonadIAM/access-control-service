import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";

import { SCRIPT_LOADER_SERVICE } from "./tokens";

@Injectable()
export class ScriptExecutorService implements InfrastructureServices.ScriptExecutor.Contract {
    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
        @Inject(SCRIPT_LOADER_SERVICE)
        private readonly scriptLoaderService: InfrastructureServices.ScriptLoader.Contract,
    ) {}

    public async execute<T>(
        props: InfrastructureServices.ScriptExecutor.Execute.Props,
    ): InfrastructureServices.ScriptExecutor.Execute.Result<T> {
        const { script, args, keys = [] } = props;
        try {
            return await this.evalsha<T>({ script, keys, args });
        } catch (error) {
            if (error instanceof Error && error.message.includes("NOSCRIPT")) {
                await this.scriptLoaderService.reload(script);
                return await this.evalsha<T>({ script, keys, args });
            } else {
                throw error;
            }
        }
    }

    public evalsha<T>(
        props: InfrastructureServices.ScriptExecutor.Evalsha.Props,
    ): InfrastructureServices.ScriptExecutor.Evalsha.Result<T> {
        const { script, args, keys } = props;
        return this.redis.evalsha(
            this.scriptLoaderService.getHash(script),
            keys.length,
            ...keys,
            ...args,
        ) as InfrastructureServices.ScriptExecutor.Evalsha.Result<T>;
    }
}
