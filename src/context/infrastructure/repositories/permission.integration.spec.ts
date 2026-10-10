import { describe, expect, it } from "@jest/globals";
import { QueryOrder } from "@mikro-orm/postgresql";
import { ConfigService } from "@nestjs/config";

import { PermissionRepository } from "~context/infrastructure/repositories/permission.repository";
import { PermissionFixture } from "~testing/integration/repositories/permission.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { PublicStringOperator } from "~infrastructure/database/enums";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        PERMISSION_PER_REALM_LIMIT: 3,
    });
}

describe("[Repository] - Permission", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new PermissionRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new PermissionFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted permission through the schema", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm();
            const permission = await suite.fixtures().createPermission({
                description: "Mapping permission description",
                name: "Mapping Permission",
                code: "mapping.permission",
                isSystemManaged: true,
                isRevoked: true,
                realm,
            });

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: permission.id } });

            // Assert
            expect(loaded).toMatchObject({
                description: "Mapping permission description",
                createdAt: permission.createdAt,
                version: permission.version,
                name: "Mapping Permission",
                code: "mapping.permission",
                isSystemManaged: true,
                id: permission.id,
                isRevoked: true,
            });
            expect(loaded.realm.id).toBe(realm.id);
        });
    });

    describe("[Method] - findEffective", () => {
        it("[case] - resolves inherited role permissions with active account overrides", async () => {
            // Arrange
            const scenario = await suite.fixtures().inheritedScenario();

            // Act
            const [permissions, total] = await suite.repository().findEffective({
                where: { account: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 1, elementsPerPage: 20 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });

            // Assert
            expect(total).toBe(scenario.expectedPermissionCodes.length);
            expect(permissions.map(({ code }) => code).sort()).toEqual(scenario.expectedPermissionCodes);
        });

        it("[case] - ignores revoked role grants and permission overrides when resolving effective permissions", async () => {
            // Arrange
            const scenario = await suite.fixtures().revocationScenario();

            // Act
            const [permissions, total] = await suite.repository().findEffective({
                where: { account: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 1, elementsPerPage: 20 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });

            // Assert
            expect(total).toBe(scenario.expectedPermissionCodes.length);
            expect(permissions.map(({ code }) => code).sort()).toEqual(scenario.expectedPermissionCodes);
        });

        it("[case] - applies filters and pagination to the computed effective permission set", async () => {
            // Arrange
            const scenario = await suite.fixtures().filteredPageScenario();

            // Act
            const [permissions, total] = await suite.repository().findEffective({
                where: { account: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 1, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
                filters: {
                    code: { operator: PublicStringOperator.ILIKE, value: "documents." },
                    isRevoked: false,
                },
            });
            const [nextPermissions] = await suite.repository().findEffective({
                where: { account: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 2, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
                filters: {
                    code: { operator: PublicStringOperator.ILIKE, value: "documents." },
                    isRevoked: false,
                },
            });

            // Assert
            expect(total).toBe(scenario.expectedTotal);
            expect(permissions).toHaveLength(scenario.expectedPageSize);
            expect(permissions.every(({ code }) => code.startsWith("documents."))).toBe(true);
            expect([...permissions, ...nextPermissions].map(({ code }) => code)).toEqual(scenario.expectedOrderedCodes);
        });
    });

    describe("[Method] - collectEffective", () => {
        it("[case] - collects active effective permission codes across realms", async () => {
            // Arrange
            const scenario = await suite.fixtures().inheritedScenario();

            // Act
            const permissions = await suite.repository().collectEffective({ account: scenario.account });

            // Assert
            expect(permissions.map(({ permission }) => permission).sort()).toEqual(scenario.expectedPermissionCodes);
            expect(permissions.every(({ realm }) => realm === scenario.realm.id)).toBe(true);
        });
    });

    describe("[Method] - findAccountsByPermissions", () => {
        it("[case] - finds accounts affected by permissions through active roles and overrides", async () => {
            // Arrange
            const scenario = await suite.fixtures().accountsScenario();

            // Act
            const accounts = await suite.repository().findAccountsByPermissions({ permissions: [scenario.permission.id] });

            // Assert
            expect(accounts.sort()).toEqual(scenario.expectedAccounts.sort());
        });
    });

    describe("[Method] - wouldExceedPermissionLimit", () => {
        it("[case] - checks permission count limit per realm", async () => {
            // Arrange
            const scenario = await suite.fixtures().limitScenario();

            // Act
            const result = await suite.repository().wouldExceedPermissionLimit({ realm: scenario.realm.id });

            const result2 = await suite.repository().wouldExceedPermissionLimit({ realm: scenario.realm.id, count: 2 });

            // Assert
            expect(result).toBe(scenario.expectedCountOneResult);
            expect(result2).toBe(scenario.expectedCountTwoResult);
        });
    });

    describe("[Method] - getLookupList", () => {
        it("[case] - returns lookup page scoped to realm", async () => {
            // Arrange
            const scenario = await suite.fixtures().lookupScenario();

            // Act
            const [permissions, total] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 2 },
                realm: scenario.realm.id,
                term: "",
            });

            // Assert
            expect(total).toBe(scenario.expectedTotal);
            expect(permissions.map(({ code }) => code)).toEqual(scenario.expectedFirstPageCodes);
        });

        it("[case] - uses trigram similarity lookup scoped to realm", async () => {
            // Arrange
            const scenario = await suite.fixtures().lookupSearchScenario();

            // Act
            const [permissions] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 10 },
                realm: scenario.realm.id,
                term: scenario.term,
            });

            // Assert
            expect(permissions.map(({ code }) => code)).toEqual(scenario.expectedCodes);
        });
    });
});
