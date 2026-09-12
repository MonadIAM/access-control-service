import { randomUUID } from "node:crypto";

import { PermissionOverrideEffect } from "~context/enums";

import { CoreFixture } from "./core.fixture";

export class PermissionOverrideFixture extends CoreFixture implements Fixtures.PermissionOverride.Contract {
    /**
     * Builds active, revoked, expired, and cross-realm account overrides to verify per-account override limits.
     */
    public async limitScenario(): Fixtures.PermissionOverride.LimitScenario.Result {
        const account = randomUUID();
        const anotherAccount = randomUUID();
        const realm = await this.createRealm({ code: "override-limit", name: "Override Limit" });
        const anotherRealm = await this.createRealm({ code: "override-limit-other", name: "Override Limit Other" });
        const firstPermission = await this.createPermission({ realm, code: "permissions.first", name: "First Permission" });
        const secondPermission = await this.createPermission({
            code: "permissions.second",
            name: "Second Permission",
            realm,
        });
        const revokedPermission = await this.createPermission({
            code: "permissions.revoked",
            name: "Revoked Permission",
            realm,
        });
        const expiredPermission = await this.createPermission({
            code: "permissions.expired",
            name: "Expired Permission",
            realm,
        });
        const externalPermission = await this.createPermission({
            code: "permissions.external",
            name: "External Permission",
            realm: anotherRealm,
        });

        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.ALLOW,
            permission: firstPermission,
            account,
            realm,
        });
        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.DENY,
            permission: secondPermission,
            account,
            realm,
        });
        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.ALLOW,
            permission: revokedPermission,
            isRevoked: true,
            account,
            realm,
        });
        await this.createPermissionOverride({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            effect: PermissionOverrideEffect.ALLOW,
            permission: expiredPermission,
            account,
            realm,
        });
        await this.createPermissionOverride({
            effect: PermissionOverrideEffect.ALLOW,
            permission: externalPermission,
            account: anotherAccount,
            realm: anotherRealm,
        });

        return {
            expectedCountOneResult: false,
            expectedCountTwoResult: true,
            account,
            realm,
        };
    }
}
