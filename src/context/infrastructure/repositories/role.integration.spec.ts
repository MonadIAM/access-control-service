import { describe, expect, it } from "@jest/globals";
import { QueryOrder } from "@mikro-orm/postgresql";
import { ConfigService } from "@nestjs/config";

import { RoleRepository } from "~context/infrastructure/repositories/role.repository";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { RoleFixture } from "~testing/integration/repositories/role.fixture";
import { DelegatorType, RoleActorType, RoleArchetype } from "~context/enums";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        ROLE_PER_REALM_LIMIT: 3,
    });
}

describe("[Repository] - Role", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RoleRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RoleFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted role through the schema", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm();
            const role = await suite.fixtures().createDetachedRole({
                description: "Mapping role description",
                actorType: RoleActorType.SERVICE,
                archetype: RoleArchetype.COMPOSITE,
                isSystemManaged: true,
                name: "Mapping Role",
                code: "mapping.role",
                isRevoked: true,
                realm,
            });

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: role.id } });

            // Assert
            expect(loaded).toMatchObject({
                description: "Mapping role description",
                actorType: RoleActorType.SERVICE,
                archetype: RoleArchetype.COMPOSITE,
                createdAt: role.createdAt,
                isSystemManaged: true,
                version: role.version,
                name: "Mapping Role",
                code: "mapping.role",
                isRevoked: true,
                id: role.id,
            });
            expect(loaded.realm.id).toBe(realm.id);
        });
    });

    describe("[Method] - findEffective", () => {
        it("[case] - finds effective roles through hierarchy closure and ignores expired assignments", async () => {
            // Arrange
            const scenario = await suite.fixtures().effectiveScenario();

            // Act
            const [roles, total] = await suite.repository().findEffective({
                where: { account: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 1, elementsPerPage: 20 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });

            // Assert
            expect(total).toBe(scenario.expectedRoleCodes.length);
            expect(roles.map(({ code }) => code).sort()).toEqual(scenario.expectedRoleCodes);
        });

        it("[case] - keeps effective role pages stable when creation timestamps are equal", async () => {
            // Arrange
            const scenario = await suite.fixtures().effectivePageScenario();

            // Act
            const [firstPageRoles, total] = await suite.repository().findEffective({
                where: { account: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 1, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });
            const [secondPageRoles] = await suite.repository().findEffective({
                where: { account: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 2, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });

            // Assert
            expect(total).toBe(scenario.expectedOrderedCodes.length);
            expect([...firstPageRoles, ...secondPageRoles].map(({ code }) => code)).toEqual(scenario.expectedOrderedCodes);
        });
    });

    describe("[Method] - findDelegable", () => {
        it("[case] - finds delegable roles for account delegators with depth limits", async () => {
            // Arrange
            const scenario = await suite.fixtures().delegableScenario();

            // Act
            const [roles, total] = await suite.repository().findDelegable({
                where: { type: DelegatorType.ACCOUNT, id: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 1, elementsPerPage: 20 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });

            // Assert
            expect(total).toBe(scenario.expectedRoleCodes.length);
            expect(roles.map(({ code }) => code).sort()).toEqual(scenario.expectedRoleCodes);
        });

        it("[case] - keeps delegable role pages stable when creation timestamps are equal", async () => {
            // Arrange
            const scenario = await suite.fixtures().delegablePageScenario();

            // Act
            const [firstPageRoles, total] = await suite.repository().findDelegable({
                where: { type: DelegatorType.ACCOUNT, id: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 1, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });
            const [secondPageRoles] = await suite.repository().findDelegable({
                where: { type: DelegatorType.ACCOUNT, id: scenario.account, realm: scenario.realm.id },
                pagination: { currentPage: 2, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });

            // Assert
            expect(total).toBe(scenario.expectedOrderedCodes.length);
            expect([...firstPageRoles, ...secondPageRoles].map(({ code }) => code)).toEqual(scenario.expectedOrderedCodes);
        });

        it.each([
            { name: "revoked account assignments", fixture: "delegableRevokedScenario", filterRealm: true },
            { name: "expired account assignments", fixture: "delegableExpiredScenario", filterRealm: true },
            { name: "policies from another realm", fixture: "delegableRealmScenario", filterRealm: true },
            { name: "cross-realm policies without realm filter", fixture: "delegableRealmScenario", filterRealm: false },
        ] as const)("[case] - does not find delegable roles through $name", async ({ fixture, filterRealm }) => {
            // Arrange
            const scenario = await suite.fixtures()[fixture]();

            // Act
            const [roles, total] = await suite.repository().findDelegable({
                where: {
                    type: DelegatorType.ACCOUNT,
                    id: scenario.account,
                    ...(filterRealm && { realm: scenario.realm.id }),
                },
                pagination: { currentPage: 1, elementsPerPage: 20 },
                sort: { createdAt: QueryOrder.ASC },
                filters: { isRevoked: false },
            });

            // Assert
            expect(total).toBe(scenario.expectedRoleCodes.length);
            expect(roles.map(({ code }) => code).sort()).toEqual(scenario.expectedRoleCodes);
        });
    });

    describe("[Method] - findAccountsByRoles", () => {
        it("[case] - finds accounts affected by roles through active descendant assignments", async () => {
            // Arrange
            const scenario = await suite.fixtures().accountsScenario();

            // Act
            const accounts = await suite.repository().findAccountsByRoles({ roles: [scenario.role.id] });

            // Assert
            expect(accounts.sort()).toEqual(scenario.expectedAccounts.sort());
        });
    });

    describe("[Method] - getHierarchyGraph", () => {
        it("[case] - returns hierarchy graph nodes and direct edges for realm", async () => {
            // Arrange
            const scenario = await suite.fixtures().hierarchyScenario();

            // Act
            const graph = await suite.repository().getHierarchyGraph({ realm: scenario.realm.id });

            // Assert
            expect(graph.nodes).toHaveLength(scenario.expectedGraphNodes);
            expect(graph.edges).toHaveLength(scenario.expectedGraphEdges);
            expect(graph.nodes.map(({ attributes }) => attributes.code).sort()).toEqual(scenario.expectedAncestorCodes);
        });
    });

    describe("[Behavior] - hierarchy traversal", () => {
        it("[case] - finds ancestors and descendants with depth data", async () => {
            // Arrange
            const scenario = await suite.fixtures().hierarchyScenario();

            // Act
            const [ancestors, ancestorsTotal] = await suite.repository().findAncestors({
                pagination: { currentPage: 1, elementsPerPage: 20 },
                descendant: scenario.descendant.id,
                filters: { isRevoked: false },
                realm: scenario.realm.id,
                populate: [],
            });
            const [descendants, descendantsTotal] = await suite.repository().findDescendants({
                pagination: { currentPage: 1, elementsPerPage: 20 },
                filters: { isRevoked: false },
                ancestor: scenario.root.id,
                realm: scenario.realm.id,
                populate: [],
            });

            // Assert
            expect(ancestorsTotal).toBe(scenario.expectedAncestorCodes.length);
            expect(descendantsTotal).toBe(scenario.expectedDescendantCodes.length);
            expect(ancestors.map(({ code }) => code).sort()).toEqual(scenario.expectedAncestorCodes);
            expect(descendants.map(({ code }) => code).sort()).toEqual(scenario.expectedDescendantCodes);
        });
    });

    describe("[Behavior] - hierarchy traversal", () => {
        it("[case] - gets ancestors and descendants inside an existing transaction", async () => {
            // Arrange
            const scenario = await suite.fixtures().hierarchyScenario();

            // Act
            const { ancestors, directAncestors, descendants, directDescendants } = await suite.transaction(
                async (transaction) => {
                    const ancestors = await suite.repository().getAncestors({
                        where: { realm: scenario.realm.id },
                        descendant: scenario.descendant.id,
                        transaction,
                    });
                    const directAncestors = await suite.repository().getAncestors({
                        where: { realm: scenario.realm.id },
                        descendant: scenario.descendant.id,
                        transaction,
                        depth: 1,
                    });
                    const descendants = await suite.repository().getDescendants({
                        where: { realm: scenario.realm.id },
                        ancestor: scenario.root.id,
                        transaction,
                    });
                    const directDescendants = await suite.repository().getDescendants({
                        where: { realm: scenario.realm.id },
                        ancestor: scenario.root.id,
                        transaction,
                        depth: 1,
                    });
                    return { ancestors, directAncestors, descendants, directDescendants };
                },
            );

            // Assert
            expect(ancestors.map(({ code }) => code).sort()).toEqual(scenario.expectedAncestorCodes);
            expect(directAncestors.map(({ code }) => code)).toEqual(scenario.expectedDirectAncestorCodes);
            expect(descendants.map(({ code }) => code).sort()).toEqual(scenario.expectedDescendantCodes);
            expect(directDescendants.map(({ code }) => code)).toEqual(scenario.expectedDirectDescendantCodes);
        });
    });

    describe("[Method] - wouldExceedRoleLimit", () => {
        it("[case] - checks role count limit per realm", async () => {
            // Arrange
            const scenario = await suite.fixtures().limitScenario();

            // Act
            const result = await suite.repository().wouldExceedRoleLimit({ realm: scenario.realm.id });

            const result2 = await suite.repository().wouldExceedRoleLimit({ realm: scenario.realm.id, count: 2 });

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
            const [roles, total] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 2 },
                realm: scenario.realm.id,
                term: "",
            });

            // Assert
            expect(total).toBe(scenario.expectedTotal);
            expect(roles.map(({ code }) => code)).toEqual(scenario.expectedFirstPageCodes);
        });

        it("[case] - uses trigram similarity lookup scoped to realm with stable tie-breakers", async () => {
            // Arrange
            const scenario = await suite.fixtures().lookupSearchScenario();

            // Act
            const [roles] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 10 },
                realm: scenario.realm.id,
                term: scenario.term,
            });

            // Assert
            expect(roles.map(({ code }) => code)).toEqual(scenario.expectedCodes);
        });
    });
});
