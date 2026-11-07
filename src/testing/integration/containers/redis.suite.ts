import { beforeAll, beforeEach, afterAll } from "@jest/globals";
import { ConfigService } from "@nestjs/config";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import Redis from "ioredis";

import { ScriptExecutorService } from "~context/infrastructure/services/script-executor.service";
import { readProjectionSource } from "~context/infrastructure/scripts/source";
import { ProjectionScript, PROJECTION_SCRIPT_FILES, PROJECTION_MUTATION_SCRIPTS } from "~context/infrastructure/scripts";
import { RedisConfig } from "~infrastructure/redis/redis.config";

import { RedisResource } from "./redis.resource";

export function redisSuite(script?: ProjectionScript): Integration.Redis.Suite.Contract {
    let redis: Optional<Redis>;
    let executor: Optional<InfrastructureServices.ScriptExecutor.Contract>;

    beforeAll(async () => {
        redis = new Redis(RedisConfig.buildCacheOptions(RedisResource.config()));
        await redis.connect();
        executor = createExecutor(redis, script);
    });

    beforeEach(async () => {
        await requireRedis(redis).flushdb();
    });

    afterAll(async () => {
        await redis?.quit();
    });

    return {
        client: () => requireRedis(redis),
        executor: () => requireExecutor(executor),
    };
}

function createExecutor(redis: Redis, selected?: ProjectionScript): InfrastructureServices.ScriptExecutor.Contract {
    const hashes = new Map<string, string>();
    const loader: InfrastructureServices.ScriptLoader.Contract = {
        getHash: ({ mode, script }) => hashes.get(`${mode}:${script}`) ?? "0".repeat(40),
        reload: async ({ mode, script }) => {
            if (selected && selected !== script) {
                throw new Error(`Isolated test for ${selected} attempted to run ${script}`);
            }
            const directory = resolve("src/context/infrastructure/scripts");
            const content = await readProjectionSource(
                resolve(directory, PROJECTION_SCRIPT_FILES[script]),
                PROJECTION_MUTATION_SCRIPTS.includes(script) ? script : undefined,
                directory,
            );
            const source =
                mode === "consume"
                    ? (await readFile(resolve(directory, "consume.lua"), "utf8")).replace("-- PROJECTION_SCRIPT", content)
                    : content;
            const hash = await redis.script("LOAD", source);
            if (typeof hash !== "string") {
                throw new Error("Invalid test script hash");
            }
            hashes.set(`${mode}:${script}`, hash);
            return hash;
        },
    };
    return new ScriptExecutorService(new ConfigService({ INBOX_RETENTION_TTL: "1h" }), loader, redis);
}

function requireRedis(redis: Optional<Redis>): Redis {
    if (redis) {
        return redis;
    } else {
        throw new Error("Redis test resource is not started");
    }
}

function requireExecutor(
    executor: Optional<InfrastructureServices.ScriptExecutor.Contract>,
): InfrastructureServices.ScriptExecutor.Contract {
    if (executor) {
        return executor;
    } else {
        throw new Error("Integration test script executor is not initialized");
    }
}
