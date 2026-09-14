import { describe, expect, it } from "@jest/globals";

import { PermissionIntegrationHelpers } from "~testing/integration/domain-service/permission.helpers";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { postgresSuite } from "~testing/integration/postgres.suite";
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

describe("PermissionService integration", () => {
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    it("creates a persisted permission in the requested realm", async () => {
        const realm = await suite.fixtures().createRealm({ code: "permission-create" });

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

        expect(created.code).toBe("documents.read");
        expect(permissions).toHaveLength(1);
        expect(permissions[0]).toMatchObject({
            description: "Read documents",
            code: "documents.read",
            name: "Read Documents",
        });
    });

    it("rolls back permission creation when the realm limit is exceeded", async () => {
        const realm = await suite.fixtures().createRealm({ code: "permission-limit" });

        await suite.fixtures().createPermission({ realm, code: "permissions.first" });
        await suite.fixtures().createPermission({ realm, code: "permissions.second" });
        await suite.fixtures().createPermission({ realm, code: "permissions.third" });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().permissionService.create({
                    input: {
                        code: "permissions.fourth",
                        name: "Fourth",
                    },
                    realm: realm.id,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.permission.LIMIT_EXCEEDED");

        await expect(countPermissionByCode(suite, realm, "permissions.fourth")).resolves.toBe(0);
        await expect(loadPermissions(suite, realm)).resolves.toHaveLength(3);
    });

    it("rolls back bulk revoke when one permission is missing", async () => {
        const realm = await suite.fixtures().createRealm({ code: "permission-revoke-rollback" });
        const existing = await suite.fixtures().createPermission({ realm, code: "permissions.existing" });

        await expect(
            suite.transaction((transaction) =>
                suite.repository().permissionService.revoke({
                    identifiers: [existing.id, "00000000-0000-4000-8000-000000009999"],
                    realm: realm.id,
                    transaction,
                }),
            ),
        ).rejects.toThrow("services.permission.PERMISSIONS_NOT_FOUND");

        const [permission] = await loadPermissions(suite, realm);

        expect(permission.isRevoked).toBe(false);
    });
});
