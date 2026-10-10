import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { PermissionOverrideIntegrationHelpers } from "~testing/integration/domain-service/permission-override.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { PermissionOverride } from "~context/domain/entities";
import { PermissionOverrideEffect } from "~context/enums";

const helpers = new PermissionOverrideIntegrationHelpers();

async function loadOverrides(
    suite: Integration.Domain.PermissionOverride.Suite,
    account: string,
): Promise<Entities.PermissionOverride[]> {
    return await suite.transaction((transaction) =>
        transaction.find(
            PermissionOverride,
            { account },
            { populate: ["realm", "permission"], orderBy: { createdAt: "asc" } },
        ),
    );
}

async function countOverrides(
    suite: Integration.Domain.PermissionOverride.Suite,
    account: string,
    realm: Entities.Realm,
): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(PermissionOverride, { account, realm: realm.id }));
}

async function loadOverride(
    suite: Integration.Domain.PermissionOverride.Suite,
    id: string,
): Promise<Entities.PermissionOverride> {
    return await suite.transaction((transaction) => transaction.findOneOrFail(PermissionOverride, { id }));
}

describe("[DomainService] - PermissionOverride", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - creates overrides for realm and system-realm permissions", async () => {
            // Arrange
            const systemRealm = await helpers.seedSystemRealm(suite);
            const realm = await suite.fixtures().createRealm({ code: "override-create" });
            const account = randomUUID();
            const customPermission = await suite.fixtures().createPermission({ realm, code: "documents.delete" });
            const systemPermission = await suite.fixtures().createPermission({
                code: "system.audit.read",
                realm: systemRealm,
            });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().permissionOverrideService.create({
                    input: {
                        effect: PermissionOverrideEffect.DENY,
                        justification: "deny custom",
                        permission: customPermission.id,
                        account,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );
            await suite.transaction((transaction) =>
                suite.repository().permissionOverrideService.create({
                    input: {
                        effect: PermissionOverrideEffect.ALLOW,
                        justification: "allow system",
                        permission: systemPermission.id,
                        account,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );

            const overrides = await loadOverrides(suite, account);

            // Assert
            expect(overrides.map(({ permission }) => permission.code).sort()).toEqual([
                "documents.delete",
                "system.audit.read",
            ]);
            expect(overrides.every(({ realm: overrideRealm }) => overrideRealm.id === realm.id)).toBe(true);
        });

        it("[case] - rolls back override creation for a foreign non-system permission", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "override-foreign" });
            const foreignRealm = await suite.fixtures().createRealm({ code: "override-foreign-source" });
            const account = randomUUID();
            const foreignPermission = await suite.fixtures().createPermission({
                code: "foreign.permission",
                realm: foreignRealm,
            });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().permissionOverrideService.create({
                    input: {
                        effect: PermissionOverrideEffect.ALLOW,
                        justification: "foreign",
                        permission: foreignPermission.id,
                        account,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await countOverrides(suite, account, realm);

            // Assert
            await expect(result).rejects.toThrow("db.NOT_FOUND");
            expect(result2).toBe(0);
        });

        it("[case] - uses the real account and realm override limit", async () => {
            // Arrange
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "override-limit" });
            const anotherRealm = await suite.fixtures().createRealm({ code: "override-limit-other" });
            const first = await suite.fixtures().createPermission({ realm, code: "permissions.first" });
            const second = await suite.fixtures().createPermission({ realm, code: "permissions.second" });
            const third = await suite.fixtures().createPermission({ realm, code: "permissions.third" });
            const fourth = await suite.fixtures().createPermission({ realm, code: "permissions.fourth" });
            const otherRealmPermission = await suite.fixtures().createPermission({
                code: "permissions.other-realm",
                realm: anotherRealm,
            });
            await suite.fixtures().createPermissionOverride({
                effect: PermissionOverrideEffect.ALLOW,
                permission: first,
                account,
                realm,
            });
            await suite.fixtures().createPermissionOverride({
                effect: PermissionOverrideEffect.DENY,
                permission: second,
                account,
                realm,
            });
            await suite.fixtures().createPermissionOverride({
                effect: PermissionOverrideEffect.ALLOW,
                permission: third,
                account,
                realm,
            });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().permissionOverrideService.create({
                    input: {
                        effect: PermissionOverrideEffect.ALLOW,
                        justification: "too many",
                        permission: fourth.id,
                        account,
                    },
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            await suite.transaction((transaction) =>
                suite.repository().permissionOverrideService.create({
                    input: {
                        effect: PermissionOverrideEffect.ALLOW,
                        justification: "other realm",
                        permission: otherRealmPermission.id,
                        account,
                    },
                    realm: anotherRealm.id,
                    transaction,
                }),
            );
            const result2 = await countOverrides(suite, account, realm);

            const result3 = await countOverrides(suite, account, anotherRealm);

            // Assert
            await expect(result).rejects.toThrow("services.permission-override.LIMIT_EXCEEDED");
            expect(result2).toBe(3);
            expect(result3).toBe(1);
        });
    });

    describe("[Method] - clean", () => {
        it("[case] - cleans only overrides scoped to the target account and optional realm", async () => {
            // Arrange
            const account = randomUUID();
            const anotherAccount = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "override-clean" });
            const anotherRealm = await suite.fixtures().createRealm({ code: "override-clean-other" });
            const permission = await suite.fixtures().createPermission({ realm, code: "permissions.clean" });
            const anotherPermission = await suite.fixtures().createPermission({
                code: "permissions.clean-other",
                realm: anotherRealm,
            });
            await suite.fixtures().createPermissionOverride({
                effect: PermissionOverrideEffect.ALLOW,
                account,
                permission,
                realm,
            });
            await suite.fixtures().createPermissionOverride({
                effect: PermissionOverrideEffect.ALLOW,
                permission: anotherPermission,
                realm: anotherRealm,
                account,
            });
            await suite.fixtures().createPermissionOverride({
                effect: PermissionOverrideEffect.ALLOW,
                account: anotherAccount,
                permission,
                realm,
            });

            // Act
            await suite.transaction((transaction) =>
                suite.repository().permissionOverrideService.clean({
                    input: {
                        realm: realm.id,
                        account,
                    },
                    transaction,
                }),
            );
            const accountOverrides = await loadOverrides(suite, account);
            const anotherAccountOverrides = await loadOverrides(suite, anotherAccount);

            // Assert
            expect(accountOverrides.map(({ realm: overrideRealm }) => overrideRealm.id)).toEqual([anotherRealm.id]);
            expect(anotherAccountOverrides).toHaveLength(1);
        });
    });

    describe("[Method] - expire", () => {
        it("[case] - expires only provided overrides through persisted merge and revoke", async () => {
            // Arrange
            const account = randomUUID();
            const realm = await suite.fixtures().createRealm({ code: "override-expire" });
            const expiredPermission = await suite.fixtures().createPermission({ realm, code: "permissions.expired" });
            const activePermission = await suite.fixtures().createPermission({ realm, code: "permissions.active" });
            const expired = await suite.fixtures().createPermissionOverride({
                expiresAt: new Date("2026-01-01T00:00:00.000Z"),
                effect: PermissionOverrideEffect.ALLOW,
                permission: expiredPermission,
                account,
                realm,
            });
            const active = await suite.fixtures().createPermissionOverride({
                expiresAt: new Date("2999-01-01T00:00:00.000Z"),
                effect: PermissionOverrideEffect.DENY,
                permission: activePermission,
                account,
                realm,
            });

            // Act
            await suite.transaction((transaction) =>
                Promise.resolve(
                    suite.repository().permissionOverrideService.expire({
                        entities: [expired],
                        transaction,
                    }),
                ),
            );

            const result = await loadOverride(suite, expired.id);

            const result2 = await loadOverride(suite, active.id);

            // Assert
            expect(result).toEqual(expect.objectContaining({ isRevoked: true }));
            expect(result2).toEqual(expect.objectContaining({ isRevoked: false }));
        });
    });
});
