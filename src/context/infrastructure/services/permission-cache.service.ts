import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT } from "~infrastructure/redis/redis.tokens";
import { AssignmentScope } from "~context/enums";

@Injectable()
export class PermissionCacheService implements Services.PermissionCache.Contract {
    private readonly cacheTTL: number;
    private readonly namespace = "cache";
    private readonly global = "*";

    private key(account: string, realm: string): string {
        return `${this.namespace}:permissions:${account}:${realm}`;
    }

    private markerKey(account: string): string {
        return `${this.namespace}:permissions:${account}:__loaded`;
    }

    public constructor(
        @Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.cacheTTL = this.configService.getOrThrow<number>("PERMISSION_CACHE_TTL");
    }

    public async has({ permission, account, realm }: Services.PermissionCache.Has): Promise<boolean> {
        const pipeline = this.redis.pipeline();
        pipeline.sismember(this.key(account, this.global), permission);
        pipeline.sismember(this.key(account, realm), permission);

        const results = await pipeline.exec();

        return results?.some(([err, hit]) => !err && hit === 1) ?? false;
    }

    public async hasGlobal({ permission, account }: Services.PermissionCache.HasGlobal): Promise<boolean> {
        return (await this.redis.sismember(this.key(account, this.global), permission)) === 1;
    }

    public async exists({ account }: Services.PermissionCache.Exists): Promise<boolean> {
        return (await this.redis.exists(this.markerKey(account))) === 1;
    }

    public async populate({ account, rows }: Services.PermissionCache.Populate): Promise<void> {
        const pipeline = this.redis.pipeline();
        const keys = new Set<string>();

        for (const row of rows) {
            const effectiveRealm = row.scope === AssignmentScope.GLOBAL ? this.global : row.realm;
            const key = this.key(account, effectiveRealm);
            pipeline.sadd(key, row.permission);
            keys.add(key);
        }

        const marker = this.markerKey(account);
        pipeline.set(marker, "1", "EX", this.cacheTTL);

        for (const key of keys) {
            pipeline.expire(key, this.cacheTTL);
        }

        await pipeline.exec();
    }

    public async invalidate({ accounts }: Services.PermissionCache.Invalidate): Promise<void> {
        const deletePipeline = this.redis.pipeline();

        for (const account of accounts) {
            const pattern = `${this.namespace}:permissions:${account}:*`;
            let cursor = "0";

            do {
                // eslint-disable-next-line no-await-in-loop
                const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 500);

                cursor = nextCursor;

                if (keys.length > 0) {
                    deletePipeline.unlink(...keys);
                }
            } while (cursor !== "0");
        }

        await deletePipeline.exec();
    }
}
