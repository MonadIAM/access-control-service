import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { PermissionOverrideRepository } from "~context/infrastructure/repositories/permission-override.repository";
import { PermissionOverrideFixture } from "~testing/integration/repositories/permission-override.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { PermissionOverrideEffect } from "~context/enums";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        PERMISSION_OVERRIDE_PER_ACCOUNT_LIMIT: 3,
    });
}

describe("PermissionOverrideRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new PermissionOverrideRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new PermissionOverrideFixture(entityManager),
    });

    describe("findUniqueOrThrow", () => {
        it("maps the persisted override through the schema", async () => {
            const realm = await suite.fixtures().createRealm();
            const permission = await suite.fixtures().createPermission({ realm });
            const override = await suite.fixtures().createPermissionOverride({
                justification: "Mapping override justification",
                expiresAt: new Date("2027-01-01T00:00:00.000Z"),
                account: "6f1c9d64-9f4c-4d4a-9d0c-9a5f0a6a1b21",
                effect: PermissionOverrideEffect.DENY,
                isRevoked: true,
                permission,
                realm,
            });

            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: override.id } });

            expect(loaded).toMatchObject({
                justification: "Mapping override justification",
                account: "6f1c9d64-9f4c-4d4a-9d0c-9a5f0a6a1b21",
                effect: PermissionOverrideEffect.DENY,
                createdAt: override.createdAt,
                expiresAt: override.expiresAt,
                version: override.version,
                isRevoked: true,
                id: override.id,
            });
            expect(loaded.permission.id).toBe(permission.id);
            expect(loaded.realm.id).toBe(realm.id);
        });
    });

    describe("wouldExceedOverrideLimit", () => {
        it("checks active permission override count limit per account and realm", async () => {
            const scenario = await suite.fixtures().limitScenario();

            await expect(
                suite.repository().wouldExceedOverrideLimit({ account: scenario.account, realm: scenario.realm.id }),
            ).resolves.toBe(scenario.expectedCountOneResult);
            await expect(
                suite.repository().wouldExceedOverrideLimit({
                    account: scenario.account,
                    realm: scenario.realm.id,
                    count: 2,
                }),
            ).resolves.toBe(scenario.expectedCountTwoResult);
        });
    });
});
