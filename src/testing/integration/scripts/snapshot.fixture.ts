import { SYSTEM_REALM_ID } from "@monadiam/shared";
import Redis from "ioredis";

export class SnapshotProjectionFixture {
    public constructor(private readonly redis: Redis) {}

    public async restore(data: Fixtures.Projection.Snapshot.Data): Promise<void> {
        const pipeline = this.redis.pipeline();
        const key = (...parts: string[]): string => ["projection", ...parts].join(":");
        const expiry = (value: Nullable<string | number | Date> | undefined): number =>
            value ? new Date(value).getTime() : Infinity;
        const stored = (value: number): string => (value === Infinity ? "0" : String(value));
        const realms = new Set(data.realms.filter((row) => !row.is_revoked).map((row) => row.id));
        const roles = new Set(data.roles.filter((row) => !row.is_revoked && realms.has(row.realm_id)).map((row) => row.id));
        const permissions = new Set(
            data.permissions.filter((row) => !row.is_revoked && realms.has(row.realm_id)).map((row) => row.id),
        );
        for (const row of data.realms) {
            pipeline.hset(key("realm", row.id), "isRevoked", row.is_revoked ? "1" : "0");
        }
        for (const row of data.roles) {
            pipeline.hset(key("role", row.realm_id, row.id), "isRevoked", row.is_revoked ? "1" : "0");
            pipeline.sadd(key("realm-roles", row.realm_id), row.id);
        }
        for (const row of data.permissions) {
            pipeline.hset(
                key("permissions", row.realm_id),
                `${row.id}:isRevoked`,
                row.is_revoked ? "1" : "0",
                `${row.id}:code`,
                row.code,
            );
            pipeline.hset(key("permission-id-by-code", row.realm_id), row.code, row.id);
        }
        for (const row of data.roleClosures) {
            pipeline.zadd(key("role-ancestors", row.realm_id, row.descendant_id), row.depth, row.ancestor_id);
            pipeline.zadd(key("role-descendants", row.realm_id, row.ancestor_id), row.depth, row.descendant_id);
        }
        for (const row of data.accountRoleAssignments) {
            pipeline.hset(
                key("account-role-assignment", row.realm_id, row.account, row.role_id),
                "assignmentId",
                row.id,
                "isRevoked",
                row.is_revoked ? "1" : "0",
                "expiresAt",
                stored(expiry(row.expires_at)),
            );
            pipeline.sadd(key("account-role-assignments", "by-account", row.realm_id, row.account), row.role_id);
            pipeline.sadd(key("account-role-assignments", "by-role", row.realm_id, row.role_id), row.account);
        }
        for (const row of data.rolePermissionAssignments) {
            pipeline.hset(
                key("role-permission-assignments", row.realm_id, row.role_id),
                `${row.permission_id}:assignmentId`,
                row.id,
                `${row.permission_id}:isRevoked`,
                row.is_revoked ? "1" : "0",
                `${row.permission_id}:scope`,
                row.scope,
                `${row.permission_id}:permissionRealm`,
                row.permission_realm_id,
            );
            pipeline.sadd(
                key("permission-usages", "role-assignments", row.permission_realm_id, row.permission_id),
                `${row.realm_id}:${row.role_id}`,
            );
        }
        for (const row of data.permissionOverrides) {
            pipeline.hset(
                key("permission-override", row.realm_id, row.account, row.permission_id),
                "overrideId",
                row.id,
                "isRevoked",
                row.is_revoked ? "1" : "0",
                "effect",
                row.effect,
                "permissionRealm",
                row.permission_realm_id,
                "expiresAt",
                stored(expiry(row.expires_at)),
            );
            pipeline.sadd(key("permission-overrides", "by-account", row.realm_id, row.account), row.permission_id);
            pipeline.sadd(key("permission-overrides", "by-realm", row.realm_id), `${row.account}:${row.permission_id}`);
            pipeline.sadd(
                key("permission-usages", "overrides", row.permission_realm_id, row.permission_id),
                `${row.realm_id}:${row.account}`,
            );
        }

        const now = Date.now();
        const targets = new Map<string, { realm: string; account: string }>();
        for (const row of [...data.accountRoleAssignments, ...data.permissionOverrides]) {
            targets.set(`${row.realm_id}:${row.account}`, { realm: row.realm_id, account: row.account });
        }
        for (const { realm, account } of targets.values()) {
            const scores = new Map<string, number>();
            let deadline = 0;
            const add = (scope: string, owner: string, permission: string, until: number): void => {
                if (until > now && (owner === realm || owner === SYSTEM_REALM_ID)) {
                    const member = `${scope}:${owner}:${permission}`;
                    scores.set(member, Math.max(scores.get(member) ?? 0, until));
                }
            };
            if (realms.has(realm)) {
                for (const assignment of data.accountRoleAssignments.filter(
                    (row) => row.realm_id === realm && row.account === account && !row.is_revoked && roles.has(row.role_id),
                )) {
                    const until = expiry(assignment.expires_at);
                    deadline = Math.max(deadline, until);
                    const ancestors = new Set(
                        data.roleClosures
                            .filter(
                                (row) =>
                                    row.realm_id === realm &&
                                    row.descendant_id === assignment.role_id &&
                                    roles.has(row.ancestor_id),
                            )
                            .map((row) => row.ancestor_id),
                    );
                    for (const grant of data.rolePermissionAssignments.filter(
                        (row) =>
                            row.realm_id === realm &&
                            ancestors.has(row.role_id) &&
                            !row.is_revoked &&
                            permissions.has(row.permission_id),
                    )) {
                        if (grant.scope !== "GLOBAL" || realm === SYSTEM_REALM_ID) {
                            add(grant.scope, grant.permission_realm_id, grant.permission_id, until);
                        }
                    }
                }
                for (const override of data.permissionOverrides.filter(
                    (row) =>
                        row.realm_id === realm &&
                        row.account === account &&
                        !row.is_revoked &&
                        permissions.has(row.permission_id),
                )) {
                    add(override.effect, override.permission_realm_id, override.permission_id, expiry(override.expires_at));
                }
            }
            for (const permission of data.permissions) {
                const owner = permission.realm_id;
                const member = `${owner}:${permission.id}`;
                const blockedUntil = scores.get(`DENY:${member}`) ?? 0;
                for (const scope of ["REALM", "GLOBAL"]) {
                    const until = Math.max(
                        scores.get(`${scope}:${member}`) ?? 0,
                        scope === "REALM" ? (scores.get(`ALLOW:${member}`) ?? 0) : 0,
                    );
                    if (until > now && blockedUntil < until) {
                        pipeline.hset(
                            key("effective", scope, realm, account, owner),
                            permission.code,
                            `${blockedUntil}:${stored(until)}`,
                        );
                    }
                }
            }
            if (deadline > now) {
                pipeline.zadd(key("effective-realms", account), deadline === Infinity ? "+inf" : deadline, realm);
            }
            pipeline.sadd(key("effective-accounts", realm), account);
        }
        await this.redis.flushdb();
        const results = await pipeline.exec();
        for (const [error] of results ?? []) {
            if (error) {
                throw error;
            }
        }
    }
}
