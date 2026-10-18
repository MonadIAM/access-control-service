import { dataset } from "@monadiam/shared/datasets/access-control";
import { ConfigService } from "@nestjs/config";
import { readFile } from "node:fs/promises";
import { isString } from "class-validator";
import { join } from "node:path";
import dotenv from "dotenv";
import Redis from "ioredis";

import { validateEnv } from "~common/validator/env.validator";

import { RedisConfig } from "./redis.config";

dotenv.config();

class ProjectionSeed {
    private static readonly redis = new Redis(RedisConfig.buildCacheOptions(new ConfigService(validateEnv(process.env))));

    public static async run(): Promise<void> {
        try {
            await this.redis.connect();

            const cleanScript = await this.loadScript("clean.lua");
            const seedScript = await this.loadScript("seed.lua");

            await this.redis.evalsha(cleanScript, 0);
            await this.redis.evalsha(seedScript, 0, this.getPayload());
        } catch (_error) {
            process.exit(1);
        } finally {
            await this.redis.quit();
        }
    }

    private static async loadScript(file: string): Promise<string> {
        const content = await readFile(join(__dirname, "scripts", file), "utf8");
        const hash = await this.redis.script("LOAD", content);

        if (isString(hash)) {
            return hash;
        } else {
            throw new Error(`Invalid hash for ${file}`);
        }
    }

    private static getPayload(): string {
        return JSON.stringify({
            rolePermissionAssignments: dataset.RolePermissionAssignments.redis,
            accountRoleAssignments: dataset.AccountRoleAssignments.redis,
            roleClosures: dataset.RoleClosures.redis,
            permissions: dataset.Permissions.redis,
            realms: dataset.Realms.redis,
            roles: dataset.Roles.redis,
        });
    }
}

ProjectionSeed.run().catch(() => process.exit(1));
