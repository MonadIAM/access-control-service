import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";
import { Exception } from "~common/exceptions";

import { PROJECTION_SCRIPT_FILES, ProjectionScript } from "../scripts";

@Injectable()
export class ScriptLoaderService implements OnModuleInit, InfrastructureServices.ScriptLoader.Contract {
    private readonly dictionaryPath = "services.script-loader";
    private readonly scriptHashes = new Map<ProjectionScript, string>();

    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
    ) {}

    public async onModuleInit(): Promise<void> {
        await Promise.all(Object.typedEntries(PROJECTION_SCRIPT_FILES).map(([script]) => this.reload(script)));
    }

    public async reload(
        script: InfrastructureServices.ScriptLoader.Reload.Props,
    ): InfrastructureServices.ScriptLoader.Reload.Result {
        const content = await readFile(join(__dirname, "../scripts", PROJECTION_SCRIPT_FILES[script]), "utf8");
        const hash = await this.redis.script("LOAD", content);
        if (typeof hash === "string") {
            this.scriptHashes.set(script, hash);
            return hash;
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.INVALID_SCRIPT_HASH` });
        }
    }

    public getHash(
        script: InfrastructureServices.ScriptLoader.GetHash.Props,
    ): InfrastructureServices.ScriptLoader.GetHash.Result {
        const hash = this.scriptHashes.get(script);
        if (hash) {
            return hash;
        } else {
            throw Exception.invariantViolation({
                messageKey: `${this.dictionaryPath}.SCRIPT_NOT_LOADED`,
                params: { script },
            });
        }
    }
}
