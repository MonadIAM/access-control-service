import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { RoleConflictGroupRepository } from "~context/infrastructure/repositories/role-conflict-group.repository";
import { RoleConflictGroupFixture } from "~testing/integration/repositories/role-conflict-group.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        CONFLICT_GROUP_PER_REALM_LIMIT: 3,
    });
}

describe("RoleConflictGroupRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RoleConflictGroupRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RoleConflictGroupFixture(entityManager),
    });

    it("maps the persisted conflict group through the schema", async () => {
        const realm = await suite.fixtures().createRealm();
        const group = await suite.fixtures().createRoleConflictGroup({
            description: "Mapping conflict group description",
            name: "Mapping Conflict Group",
            code: "mapping.conflict-group",
            isSystemManaged: true,
            isRevoked: true,
            maxAllowed: 3,
            realm,
        });

        const loaded = await suite.repository().findUniqueOrThrow({ where: { id: group.id } });

        expect(loaded).toMatchObject({
            description: "Mapping conflict group description",
            name: "Mapping Conflict Group",
            code: "mapping.conflict-group",
            createdAt: group.createdAt,
            version: group.version,
            isSystemManaged: true,
            isRevoked: true,
            maxAllowed: 3,
            id: group.id,
        });
        expect(loaded.realm.id).toBe(realm.id);
    });

    it("finds active groups violated by account assignments and candidate roles", async () => {
        const scenario = await suite.fixtures().violatedGroupsScenario();

        const groups = await suite.repository().findGroupsViolatedByAccount({
            roles: scenario.candidateRoles.map(({ id }) => id),
            account: scenario.account,
            realm: scenario.realm.id,
        });

        await expect(
            suite.repository().hasGroupsViolatedByAccount({
                roles: scenario.candidateRoles.map(({ id }) => id),
                account: scenario.account,
                realm: scenario.realm.id,
            }),
        ).resolves.toBe(true);
        expect(groups.map(({ code }) => code).sort()).toEqual(scenario.expectedGroupCodes);
    });

    it("does not find groups violated through expired account assignments", async () => {
        const scenario = await suite.fixtures().violatedExpiredScenario();

        const groups = await suite.repository().findGroupsViolatedByAccount({
            roles: scenario.candidateRoles.map(({ id }) => id),
            account: scenario.account,
            realm: scenario.realm.id,
        });

        await expect(
            suite.repository().hasGroupsViolatedByAccount({
                roles: scenario.candidateRoles.map(({ id }) => id),
                account: scenario.account,
                realm: scenario.realm.id,
            }),
        ).resolves.toBe(false);
        expect(groups.map(({ code }) => code).sort()).toEqual(scenario.expectedGroupCodes);
    });

    it("finds accounts violating a role conflict rule", async () => {
        const scenario = await suite.fixtures().violatingAccountsScenario();

        const accounts = await suite.repository().findAccountsViolatingRule({
            identifiers: scenario.roles.map(({ id }) => id),
            maxAllowed: scenario.maxAllowed,
            realm: scenario.realm.id,
        });

        await expect(
            suite.repository().hasAccountsViolatingRule({
                identifiers: scenario.roles.map(({ id }) => id),
                maxAllowed: scenario.maxAllowed,
                realm: scenario.realm.id,
            }),
        ).resolves.toBe(true);
        expect(accounts.map(({ account }) => account).sort()).toEqual(scenario.expectedAccounts);
    });

    it("detects configured groups with violating accounts", async () => {
        const scenario = await suite.fixtures().violatingGroupsScenario();

        await expect(
            suite.repository().hasGroupsWithViolatingAccounts({
                groups: scenario.groups.map(({ id }) => id),
                realm: scenario.realm.id,
            }),
        ).resolves.toBe(scenario.expectedResult);
    });

    it("does not detect configured groups violated only by expired account assignments", async () => {
        const scenario = await suite.fixtures().violatingGroupsExpiredScenario();

        await expect(
            suite.repository().hasGroupsWithViolatingAccounts({
                groups: scenario.groups.map(({ id }) => id),
                realm: scenario.realm.id,
            }),
        ).resolves.toBe(scenario.expectedResult);
    });

    it("does not detect configured groups violated only by foreign-realm roles", async () => {
        const scenario = await suite.fixtures().violatingGroupsRealmScenario();

        await expect(
            suite.repository().hasGroupsWithViolatingAccounts({
                groups: scenario.groups.map(({ id }) => id),
                realm: scenario.realm.id,
            }),
        ).resolves.toBe(scenario.expectedResult);
    });

    it("checks active conflict group count limit per realm", async () => {
        const scenario = await suite.fixtures().limitScenario();

        await expect(suite.repository().wouldExceedGroupLimit({ realm: scenario.realm.id })).resolves.toBe(
            scenario.expectedCountOneResult,
        );
        await expect(suite.repository().wouldExceedGroupLimit({ realm: scenario.realm.id, count: 2 })).resolves.toBe(
            scenario.expectedCountTwoResult,
        );
    });
});
