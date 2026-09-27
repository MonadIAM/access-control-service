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

describe("PermissionRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new PermissionRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new PermissionFixture(entityManager),
    });

    describe("findUniqueOrThrow", () => {
        it("maps the persisted permission through the schema", async () => {
            const realm = await suite.fixtures().createRealm();
            const permission = await suite.fixtures().createPermission({
                description: "Mapping permission description",
                name: "Mapping Permission",
                code: "mapping.permission",
                isSystemManaged: true,
                isRevoked: true,
                realm,
            });

            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: permission.id } });

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

    describe("findEffective", () => {
        it("resolves inherited role permissions with active account overrides", async () => {
            const scenario = await suite.fixtures().inheritedScenario();

            const [permissions, total] = await suite.repository().findEffective({
                where: { account: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 1, elementsPerPage: 20 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });

            expect(total).toBe(scenario.expectedPermissionCodes.length);
            expect(permissions.map(({ code }) => code).sort()).toEqual(scenario.expectedPermissionCodes);
        });

        it("ignores revoked role grants and permission overrides when resolving effective permissions", async () => {
            const scenario = await suite.fixtures().revocationScenario();

            const [permissions, total] = await suite.repository().findEffective({
                where: { account: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 1, elementsPerPage: 20 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });

            expect(total).toBe(scenario.expectedPermissionCodes.length);
            expect(permissions.map(({ code }) => code).sort()).toEqual(scenario.expectedPermissionCodes);
        });

        it("applies filters and pagination to the computed effective permission set", async () => {
            const scenario = await suite.fixtures().filteredPageScenario();

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

            expect(total).toBe(scenario.expectedTotal);
            expect(permissions).toHaveLength(scenario.expectedPageSize);
            expect(permissions.every(({ code }) => code.startsWith("documents."))).toBe(true);
            expect([...permissions, ...nextPermissions].map(({ code }) => code)).toEqual(scenario.expectedOrderedCodes);
        });
    });

    describe("collectEffective", () => {
        it("collects active effective permission codes across realms", async () => {
            const scenario = await suite.fixtures().inheritedScenario();

            const permissions = await suite.repository().collectEffective({ account: scenario.account });

            expect(permissions.map(({ permission }) => permission).sort()).toEqual(scenario.expectedPermissionCodes);
            expect(permissions.every(({ realm }) => realm === scenario.realm.id)).toBe(true);
        });
    });

    describe("findAccountsByPermissions", () => {
        it("finds accounts affected by permissions through active roles and overrides", async () => {
            const scenario = await suite.fixtures().accountsScenario();

            const accounts = await suite.repository().findAccountsByPermissions({ permissions: [scenario.permission.id] });

            expect(accounts.sort()).toEqual(scenario.expectedAccounts.sort());
        });
    });

    describe("wouldExceedPermissionLimit", () => {
        it("checks permission count limit per realm", async () => {
            const scenario = await suite.fixtures().limitScenario();

            await expect(suite.repository().wouldExceedPermissionLimit({ realm: scenario.realm.id })).resolves.toBe(
                scenario.expectedCountOneResult,
            );
            await expect(
                suite.repository().wouldExceedPermissionLimit({ realm: scenario.realm.id, count: 2 }),
            ).resolves.toBe(scenario.expectedCountTwoResult);
        });
    });

    describe("getLookupList", () => {
        it("returns lookup page scoped to realm", async () => {
            const scenario = await suite.fixtures().lookupScenario();

            const [permissions, total] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 2 },
                realm: scenario.realm.id,
                term: "",
            });

            expect(total).toBe(scenario.expectedTotal);
            expect(permissions.map(({ code }) => code)).toEqual(scenario.expectedFirstPageCodes);
        });

        it("uses trigram similarity lookup scoped to realm", async () => {
            const scenario = await suite.fixtures().lookupSearchScenario();

            const [permissions] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 10 },
                realm: scenario.realm.id,
                term: scenario.term,
            });

            expect(permissions.map(({ code }) => code)).toEqual(scenario.expectedCodes);
        });
    });
});
