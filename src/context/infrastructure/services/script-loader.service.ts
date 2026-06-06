import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/tokens";
import { Exception } from "~common/exceptions";

import { PROJECTION_SCRIPT_FILES, ProjectionScript } from "../scripts";

@Injectable()
export class ScriptLoaderService implements OnModuleInit, InfrastructureServices.ScriptLoader.Contract {
    private readonly scriptHashes = new Map<ProjectionScript, string>();

    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
    ) {}

    public async onModuleInit(): Promise<void> {
        await Promise.all(Object.typedEntries(PROJECTION_SCRIPT_FILES).map(([script]) => this.reload(script)));
    }

    public async reload(script: ProjectionScript): Promise<string> {
        const content = await readFile(join(__dirname, "../scripts", PROJECTION_SCRIPT_FILES[script]), "utf8");
        const hash = await this.redis.script("LOAD", content);
        if (typeof hash === "string") {
            this.scriptHashes.set(script, hash);
            return hash;
        } else {
            throw Exception.invariantViolation({ messageKey: "Redis returned an invalid Lua script hash." });
        }
    }

    public getHash(script: ProjectionScript): string {
        const hash = this.scriptHashes.get(script);
        if (hash) {
            return hash;
        } else {
            throw Exception.invariantViolation({ messageKey: `Projection Lua script is not loaded: ${script}` });
        }
    }
}
