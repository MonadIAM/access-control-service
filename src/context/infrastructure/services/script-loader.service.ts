import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis";
import { Exception } from "~common/exceptions";

import { PROJECTION_MUTATION_SCRIPTS, PROJECTION_SCRIPT_FILES, ProjectionScript } from "../scripts";

const CONSUME_SCRIPT_PLACEHOLDER = "-- PROJECTION_SCRIPT";

@Injectable()
export class ScriptLoaderService implements OnModuleInit, InfrastructureServices.ScriptLoader.Contract {
    private readonly dictionaryPath = "services.script-loader";
    private readonly consumeScript = readFile(join(__dirname, "../scripts/consume.lua"), "utf8");
    private readonly scriptHashes: Record<InfrastructureServices.ScriptLoader.Mode, Map<ProjectionScript, string>> = {
        consume: new Map<ProjectionScript, string>(),
        execute: new Map<ProjectionScript, string>(),
    };

    public constructor(
        @Inject(REDIS_CACHE_CLIENT)
        private readonly redis: Redis,
    ) {}

    public async onModuleInit(): Promise<void> {
        await Promise.all([
            ...Object.typedEntries(PROJECTION_SCRIPT_FILES).map(([script]) => this.reload({ mode: "execute", script })),
            ...PROJECTION_MUTATION_SCRIPTS.map((script) => this.reload({ mode: "consume", script })),
        ]);
    }

    public async reload(
        props: InfrastructureServices.ScriptLoader.Reload.Props,
    ): InfrastructureServices.ScriptLoader.Reload.Result {
        const { script, mode } = props;
        const content = await readFile(join(__dirname, "../scripts", PROJECTION_SCRIPT_FILES[script]), "utf8");
        const source =
            mode === "consume" ? (await this.consumeScript).replace(CONSUME_SCRIPT_PLACEHOLDER, content) : content;
        const hash = await this.redis.script("LOAD", source);
        if (typeof hash === "string") {
            this.scriptHashes[mode].set(script, hash);
            return hash;
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.INVALID_SCRIPT_HASH` });
        }
    }

    public getHash(
        props: InfrastructureServices.ScriptLoader.GetHash.Props,
    ): InfrastructureServices.ScriptLoader.GetHash.Result {
        const { script, mode } = props;
        const hash = this.scriptHashes[mode].get(script);
        if (hash) {
            return hash;
        } else {
            throw Exception.invariantViolation({
                messageKey: `${this.dictionaryPath}.SCRIPT_NOT_LOADED`,
                params: { mode, script },
            });
        }
    }
}
