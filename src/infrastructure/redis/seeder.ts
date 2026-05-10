import { readFile } from "node:fs/promises";
import { isString } from "class-validator";
import { join } from "node:path";
import dotenv from "dotenv";
import Redis from "ioredis";

import SystemDatasets from "../datasets/system";
import DemoDatasets from "../datasets/demo";

dotenv.config();

class ProjectionSeed {
    private static readonly redis = new Redis({
        db: Number(process.env.REDIS_DB_CACHE),
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        host: process.env.REDIS_HOST,
        enableAutoPipelining: true,
        maxRetriesPerRequest: 20,
        lazyConnect: true,
    });

    public static async run(): Promise<void> {
        const args = process.argv.slice(2);
        const datasetArg = args.find((arg) => arg.startsWith("--dataset="))?.split("=")[1];

        if (!datasetArg || !["system", "demo"].includes(datasetArg)) {
            process.exit(1);
        }

        const isSystem = datasetArg === "system";
        const selected = isSystem ? SystemDatasets : DemoDatasets;

        try {
            await this.redis.connect();

            const cleanScript = await this.loadScript("clean.lua");
            const seedScript = await this.loadScript("seed.lua");

            isSystem && (await this.redis.evalsha(cleanScript, 0));
            await this.redis.evalsha(seedScript, 0, this.getPayload(selected));
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

    private static getPayload(data: Dataset): string {
        return JSON.stringify({
            rolePermissionAssignments: data.RolePermissionAssignments,
            accountRoleAssignments: data.AccountRoleAssignments,
            roleClosures: data.RoleClosures,
            permissions: data.Permissions,
            realms: data.Realms,
            roles: data.Roles,
        });
    }
}

ProjectionSeed.run().catch(() => process.exit(1));
