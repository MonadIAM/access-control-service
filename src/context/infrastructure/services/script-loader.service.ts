import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { isString } from "class-validator";
import { join } from "node:path";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/redis.tokens";
import { ServiceException } from "~common/exceptions";

import { PROJECTION_SCRIPT_FILES, ProjectionScript } from "../scripts";

@Injectable()
export class ScriptLoaderService implements OnModuleInit, InfrastructureServices.ScriptLoader.Contract {
    private readonly scriptHashes = new Map<ProjectionScript, string>();

    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
    ) {}

    public async onModuleInit(): Promise<void> {
        const entries = Object.typedEntries(PROJECTION_SCRIPT_FILES);
        await Promise.all(
            entries.map(async ([script, file]) => {
                const content = await readFile(join(__dirname, "../scripts", file), "utf8");
                const hash = await this.redis.script("LOAD", content);
                if (isString(hash)) {
                    return this.scriptHashes.set(script, hash);
                } else {
                    throw ServiceException.invariantViolation("Redis returned an invalid Lua script hash.");
                }
            }),
        );
    }

    public getHash(script: ProjectionScript): string {
        const hash = this.scriptHashes.get(script);
        if (hash) {
            return hash;
        } else {
            throw ServiceException.invariantViolation(`Projection Lua script is not loaded: ${script}`);
        }
    }
}
