import { readFile } from "node:fs/promises";
import { isString } from "class-validator";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import dotenv from "dotenv";
import Redis from "ioredis";

import datasets from "../datasets";

dotenv.config();

class ProjectionSeed {
    private static readonly redis = new Redis({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        db: Number(process.env.REDIS_DB_CACHE),
        password: process.env.REDIS_PASSWORD,
        tls: {
            rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED === "true",
            cert: readFileSync(process.env.REDIS_TLS_CERT_FILE, "utf8"),
            key: readFileSync(process.env.REDIS_TLS_KEY_FILE, "utf8"),
            ca: readFileSync(process.env.REDIS_TLS_CA_FILE, "utf8"),
            servername: process.env.REDIS_HOST,
        },
        enableAutoPipelining: true,
        maxRetriesPerRequest: 20,
        lazyConnect: true,
    });

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
            rolePermissionAssignments: datasets.RolePermissionAssignments.redis,
            accountRoleAssignments: datasets.AccountRoleAssignments.redis,
            roleClosures: datasets.RoleClosures.redis,
            permissions: datasets.Permissions.redis,
            realms: datasets.Realms.redis,
            roles: datasets.Roles.redis,
        });
    }
}

ProjectionSeed.run().catch(() => process.exit(1));
