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

    private permissionKey(account: string, realm: string): string {
        return `${this.namespace}:account:${account}:permissions:${realm}`;
    }

    private realmKey(account: string): string {
        return `${this.namespace}:account:${account}:realms:member`;
    }

    private markerKey(account: string): string {
        return `${this.namespace}:account:${account}:__loaded`;
    }

    public constructor(
        @Inject(REDIS_CACHE_CLIENT) private readonly redis: Redis,
        private readonly configService: ConfigService,
    ) {
        this.cacheTTL = this.configService.getOrThrow<number>("PERMISSION_CACHE_TTL");
    }

    public async has({ permissions, account, realm }: Services.PermissionCache.Has): Promise<string[]> {
        const [globalHits, realmHits] = await Promise.all([
            this.redis.smismember(this.permissionKey(account, this.global), ...permissions),
            this.redis.smismember(this.permissionKey(account, realm), ...permissions),
        ]);

        return permissions.filter((_, i) => globalHits[i] === 1 || realmHits[i] === 1);
    }

    public async hasGlobal({ permissions, account }: Services.PermissionCache.HasGlobal): Promise<string[]> {
        const hits = await this.redis.smismember(this.permissionKey(account, this.global), ...permissions);

        return permissions.filter((_, i) => hits[i] === 1);
    }

    public async hasRealm({ account, realm }: Services.PermissionCache.HasRealm): Promise<boolean> {
        return (await this.redis.sismember(this.realmKey(account), realm)) === 1;
    }

    public async getRealms({ account }: Services.PermissionCache.GetRealms): Promise<string[]> {
        return await this.redis.smembers(this.realmKey(account));
    }

    public async exists({ account }: Services.PermissionCache.Exists): Promise<boolean> {
        return (await this.redis.exists(this.markerKey(account))) === 1;
    }

    public async populate({ account, rows, realms }: Services.PermissionCache.Populate): Promise<void> {
        const pipeline = this.redis.pipeline();
        const permissionKeys = new Set<string>();
        const memberRealmKey = this.realmKey(account);

        for (const row of rows) {
            const effectiveRealm = row.scope === AssignmentScope.GLOBAL ? this.global : row.realm;
            const permissionKey = this.permissionKey(account, effectiveRealm);

            pipeline.sadd(permissionKey, row.permission);
            permissionKeys.add(permissionKey);
        }

        if (realms.length > 0) {
            pipeline.sadd(memberRealmKey, ...realms);
        }

        pipeline.expire(memberRealmKey, this.cacheTTL);
        pipeline.set(this.markerKey(account), "1", "EX", this.cacheTTL);

        for (const permissionKey of permissionKeys) {
            pipeline.expire(permissionKey, this.cacheTTL);
        }

        await pipeline.exec();
    }

    public async invalidate({ accounts }: Services.PermissionCache.Invalidate): Promise<void> {
        const deletePipeline = this.redis.pipeline();

        for (const account of accounts) {
            const pattern = `${this.namespace}:account:${account}:*`;
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
