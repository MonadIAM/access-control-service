import { describe, expect, it } from "@jest/globals";
import { QueryOrder } from "@mikro-orm/postgresql";
import { ConfigService } from "@nestjs/config";

import { RoleRepository } from "~context/infrastructure/repositories/role.repository";
import { DelegatorType, RoleActorType, RoleArchetype } from "~context/enums";
import { postgresSuite } from "~testing/integration/postgres.suite";
import { RoleFixture } from "~testing/integration/repositories/role.fixture";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        ROLE_PER_REALM_LIMIT: 3,
    });
}

describe("RoleRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RoleRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RoleFixture(entityManager),
    });

    it("maps the persisted role through the schema", async () => {
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

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: role.id } });

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

    it("finds effective roles through hierarchy closure and ignores expired assignments", async () => {
        const scenario = await suite.fixtures().effectiveScenario();

        const [roles, total] = await suite.repository().findEffective({
            where: { account: scenario.account, realm: scenario.realm.id },
            pagination: { currentPage: 1, elementsPerPage: 20 },
            sort: { createdAt: QueryOrder.ASC },
            filters: { isRevoked: false },
        });

        expect(total).toBe(scenario.expectedRoleCodes.length);
        expect(roles.map(({ code }) => code).sort()).toEqual(scenario.expectedRoleCodes);
    });

    it("keeps effective role pages stable when creation timestamps are equal", async () => {
        const scenario = await suite.fixtures().effectivePageScenario();

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

        expect(total).toBe(scenario.expectedOrderedCodes.length);
        expect([...firstPageRoles, ...secondPageRoles].map(({ code }) => code)).toEqual(scenario.expectedOrderedCodes);
    });

    it("finds delegable roles for account delegators with depth limits", async () => {
        const scenario = await suite.fixtures().delegableScenario();

        const [roles, total] = await suite.repository().findDelegable({
            where: { type: DelegatorType.ACCOUNT, id: scenario.account, realm: scenario.realm.id },
            pagination: { currentPage: 1, elementsPerPage: 20 },
            sort: { createdAt: QueryOrder.ASC },
            filters: { isRevoked: false },
        });

        expect(total).toBe(scenario.expectedRoleCodes.length);
        expect(roles.map(({ code }) => code).sort()).toEqual(scenario.expectedRoleCodes);
    });

    it("keeps delegable role pages stable when creation timestamps are equal", async () => {
        const scenario = await suite.fixtures().delegablePageScenario();

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

        expect(total).toBe(scenario.expectedOrderedCodes.length);
        expect([...firstPageRoles, ...secondPageRoles].map(({ code }) => code)).toEqual(scenario.expectedOrderedCodes);
    });

    it("does not find delegable roles through revoked account assignments", async () => {
        const scenario = await suite.fixtures().delegableRevokedScenario();

        const [roles, total] = await suite.repository().findDelegable({
            where: { type: DelegatorType.ACCOUNT, id: scenario.account, realm: scenario.realm.id },
            pagination: { currentPage: 1, elementsPerPage: 20 },
            sort: { createdAt: QueryOrder.ASC },
            filters: { isRevoked: false },
        });

        expect(total).toBe(scenario.expectedRoleCodes.length);
        expect(roles.map(({ code }) => code).sort()).toEqual(scenario.expectedRoleCodes);
    });

    it("does not find delegable roles through expired account assignments", async () => {
        const scenario = await suite.fixtures().delegableExpiredScenario();

        const [roles, total] = await suite.repository().findDelegable({
            where: { type: DelegatorType.ACCOUNT, id: scenario.account, realm: scenario.realm.id },
            pagination: { currentPage: 1, elementsPerPage: 20 },
            sort: { createdAt: QueryOrder.ASC },
            filters: { isRevoked: false },
        });

        expect(total).toBe(scenario.expectedRoleCodes.length);
        expect(roles.map(({ code }) => code).sort()).toEqual(scenario.expectedRoleCodes);
    });

    it("does not find delegable roles through policies from another realm", async () => {
        const scenario = await suite.fixtures().delegableRealmScenario();

        const [roles, total] = await suite.repository().findDelegable({
            where: { type: DelegatorType.ACCOUNT, id: scenario.account, realm: scenario.realm.id },
            pagination: { currentPage: 1, elementsPerPage: 20 },
            sort: { createdAt: QueryOrder.ASC },
            filters: { isRevoked: false },
        });

        expect(total).toBe(scenario.expectedRoleCodes.length);
        expect(roles.map(({ code }) => code).sort()).toEqual(scenario.expectedRoleCodes);
    });

    it("does not find delegable roles through cross-realm policies without realm filter", async () => {
        const scenario = await suite.fixtures().delegableRealmScenario();

        const [roles, total] = await suite.repository().findDelegable({
            where: { type: DelegatorType.ACCOUNT, id: scenario.account },
            pagination: { currentPage: 1, elementsPerPage: 20 },
            sort: { createdAt: QueryOrder.ASC },
            filters: { isRevoked: false },
        });

        expect(total).toBe(scenario.expectedRoleCodes.length);
        expect(roles.map(({ code }) => code).sort()).toEqual(scenario.expectedRoleCodes);
    });

    it("finds accounts affected by roles through active descendant assignments", async () => {
        const scenario = await suite.fixtures().accountsScenario();

        const accounts = await suite.repository().findAccountsByRoles({ roles: [scenario.role.id] });

        expect(accounts.sort()).toEqual(scenario.expectedAccounts.sort());
    });

    it("returns hierarchy graph nodes and direct edges for realm", async () => {
        const scenario = await suite.fixtures().hierarchyScenario();

        const graph = await suite.repository().getHierarchyGraph({ realm: scenario.realm.id });

        expect(graph.nodes).toHaveLength(scenario.expectedGraphNodes);
        expect(graph.edges).toHaveLength(scenario.expectedGraphEdges);
        expect(graph.nodes.map(({ attributes }) => attributes.code).sort()).toEqual(scenario.expectedAncestorCodes);
    });

    it("finds ancestors and descendants with depth data", async () => {
        const scenario = await suite.fixtures().hierarchyScenario();

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

        expect(ancestorsTotal).toBe(scenario.expectedAncestorCodes.length);
        expect(descendantsTotal).toBe(scenario.expectedDescendantCodes.length);
        expect(ancestors.map(({ code }) => code).sort()).toEqual(scenario.expectedAncestorCodes);
        expect(descendants.map(({ code }) => code).sort()).toEqual(scenario.expectedDescendantCodes);
    });

    it("gets ancestors and descendants inside an existing transaction", async () => {
        const scenario = await suite.fixtures().hierarchyScenario();

        await suite.transaction(async (transaction) => {
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

            expect(ancestors.map(({ code }) => code).sort()).toEqual(scenario.expectedAncestorCodes);
            expect(directAncestors.map(({ code }) => code)).toEqual(scenario.expectedDirectAncestorCodes);
            expect(descendants.map(({ code }) => code).sort()).toEqual(scenario.expectedDescendantCodes);
            expect(directDescendants.map(({ code }) => code)).toEqual(scenario.expectedDirectDescendantCodes);
        });
    });

    it("checks role count limit per realm", async () => {
        const scenario = await suite.fixtures().limitScenario();

        await expect(suite.repository().wouldExceedRoleLimit({ realm: scenario.realm.id })).resolves.toBe(
            scenario.expectedCountOneResult,
        );
        await expect(suite.repository().wouldExceedRoleLimit({ realm: scenario.realm.id, count: 2 })).resolves.toBe(
            scenario.expectedCountTwoResult,
        );
    });

    it("returns lookup page scoped to realm", async () => {
        const scenario = await suite.fixtures().lookupScenario();

        const [roles, total] = await suite.repository().getLookupList({
            pagination: { currentPage: 1, elementsPerPage: 2 },
            realm: scenario.realm.id,
            term: "",
        });

        expect(total).toBe(scenario.expectedTotal);
        expect(roles.map(({ code }) => code)).toEqual(scenario.expectedFirstPageCodes);
    });

    it("uses trigram similarity lookup scoped to realm with stable tie-breakers", async () => {
        const scenario = await suite.fixtures().lookupSearchScenario();

        const [roles] = await suite.repository().getLookupList({
            pagination: { currentPage: 1, elementsPerPage: 10 },
            realm: scenario.realm.id,
            term: scenario.term,
        });

        expect(roles.map(({ code }) => code)).toEqual(scenario.expectedCodes);
    });
});
