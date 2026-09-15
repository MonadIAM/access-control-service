import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";

import { SCRIPT_LOADER_SERVICE } from "./tokens";

@Injectable()
export class ScriptExecutorService implements InfrastructureServices.ScriptExecutor.Contract {
    private readonly inboxTTL: number;

    public constructor(
        configService: ConfigService,
        @Inject(SCRIPT_LOADER_SERVICE)
        private readonly scriptLoaderService: InfrastructureServices.ScriptLoader.Contract,
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
    ) {
        this.inboxTTL = ms(configService.getOrThrow<StringValue>("INBOX_RETENTION_TTL"));
    }

    public async consume<T>(
        props: InfrastructureServices.ScriptExecutor.Consume.Props,
    ): InfrastructureServices.ScriptExecutor.Consume.Result<T> {
        const { script, args, event, keys = [] } = props;
        const result = await this.executeScript<InfrastructureServices.ScriptExecutor.Consume.ScriptResult<T>>({
            keys: [...keys, `projection:inbox:${event}`],
            args: [...args, this.inboxTTL.toString()],
            mode: "consume",
            script,
        });

        if (result[0] === 1) {
            return { status: "processed", value: result[1] };
        } else {
            return { status: "duplicate" };
        }
    }

    public async execute<T>(
        props: InfrastructureServices.ScriptExecutor.Execute.Props,
    ): InfrastructureServices.ScriptExecutor.Execute.Result<T> {
        const { script, args, keys = [] } = props;
        return await this.executeScript<T>({ mode: "execute", script, keys, args });
    }

    public async executeScript<T>(
        props: InfrastructureServices.ScriptExecutor.ExecuteScript.Props,
    ): InfrastructureServices.ScriptExecutor.ExecuteScript.Result<T> {
        const { script, mode } = props;
        try {
            return await this.evalsha<T>(props);
        } catch (error) {
            if (error instanceof Error && error.message.includes("NOSCRIPT")) {
                await this.scriptLoaderService.reload({ mode, script });
                return await this.evalsha<T>(props);
            } else {
                throw error;
            }
        }
    }

    public evalsha<T>(
        props: InfrastructureServices.ScriptExecutor.Evalsha.Props,
    ): InfrastructureServices.ScriptExecutor.Evalsha.Result<T> {
        const { script, mode, args, keys } = props;
        return this.redis.evalsha(
            this.scriptLoaderService.getHash({ script, mode }),
            keys.length,
            ...keys,
            ...args,
        ) as InfrastructureServices.ScriptExecutor.Evalsha.Result<T>;
    }
}
