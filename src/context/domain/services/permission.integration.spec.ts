import { describe, expect, it } from "@jest/globals";

import { PermissionIntegrationHelpers } from "~testing/integration/domain-service/permission.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { Permission } from "~context/domain/entities";

const helpers = new PermissionIntegrationHelpers();

async function loadPermissions(
    suite: Integration.Domain.Permission.Suite,
    realm: Entities.Realm,
): Promise<Entities.Permission[]> {
    return await suite.transaction((transaction) =>
        transaction.find(Permission, { realm: realm.id }, { orderBy: { code: "asc" } }),
    );
}

async function countPermissionByCode(
    suite: Integration.Domain.Permission.Suite,
    realm: Entities.Realm,
    code: string,
): Promise<number> {
    return await suite.transaction((transaction) => transaction.count(Permission, { realm: realm.id, code }));
}

describe("[DomainService] - Permission", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - create", () => {
        it("[case] - creates a persisted permission in the requested realm", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "permission-create" });

            // Act
            const created = await suite.transaction((transaction) =>
                suite.repository().permissionService.create({
                    input: {
                        description: "Read documents",
                        code: "documents.read",
                        name: "Read Documents",
                    },
                    realm: realm.id,
                    transaction,
                }),
            );

            const permissions = await loadPermissions(suite, realm);

            // Assert
            expect(created.code).toBe("documents.read");
            expect(permissions).toHaveLength(1);
            expect(permissions[0]).toMatchObject({
                description: "Read documents",
                code: "documents.read",
                name: "Read Documents",
            });
        });

        it("[case] - rolls back permission creation when the realm limit is exceeded", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "permission-limit" });
            await suite.fixtures().createPermission({ realm, code: "permissions.first" });
            await suite.fixtures().createPermission({ realm, code: "permissions.second" });
            await suite.fixtures().createPermission({ realm, code: "permissions.third" });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().permissionService.create({
                    input: {
                        code: "permissions.fourth",
                        name: "Fourth",
                    },
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const result2 = await countPermissionByCode(suite, realm, "permissions.fourth");

            const result3 = await loadPermissions(suite, realm);

            // Assert
            await expect(result).rejects.toThrow("services.permission.LIMIT_EXCEEDED");
            expect(result2).toBe(0);
            expect(result3).toHaveLength(3);
        });
    });

    describe("[Method] - revoke", () => {
        it("[case] - rolls back bulk revoke when one permission is missing", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "permission-revoke-rollback" });
            const existing = await suite.fixtures().createPermission({ realm, code: "permissions.existing" });

            // Act
            const result = suite.transaction((transaction) =>
                suite.repository().permissionService.revoke({
                    identifiers: [existing.id, "00000000-0000-4000-8000-000000009999"],
                    realm: realm.id,
                    transaction,
                }),
            );
            await Promise.allSettled([result]);
            const [permission] = await loadPermissions(suite, realm);

            // Assert
            await expect(result).rejects.toThrow("services.permission.PERMISSIONS_NOT_FOUND");
            expect(permission.isRevoked).toBe(false);
        });
    });
});
