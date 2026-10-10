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

describe("[Repository] - RoleConflictGroup", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RoleConflictGroupRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RoleConflictGroupFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted conflict group through the schema", async () => {
            // Arrange
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

            // Act
            const loaded = await suite.repository().findUniqueOrThrow({ where: { id: group.id } });

            // Assert
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
    });

    describe("[Behavior] - group violations", () => {
        it("[case] - finds active groups violated by account assignments and candidate roles", async () => {
            // Arrange
            const scenario = await suite.fixtures().violatedGroupsScenario();
            const groups = await suite.repository().findGroupsViolatedByAccount({
                roles: scenario.candidateRoles.map(({ id }) => id),
                account: scenario.account,
                realm: scenario.realm.id,
            });

            // Act
            const result = await suite.repository().hasGroupsViolatedByAccount({
                roles: scenario.candidateRoles.map(({ id }) => id),
                account: scenario.account,
                realm: scenario.realm.id,
            });

            // Assert
            expect(result).toBe(true);
            expect(groups.map(({ code }) => code).sort()).toEqual(scenario.expectedGroupCodes);
        });

        it("[case] - does not find groups violated through expired account assignments", async () => {
            // Arrange
            const scenario = await suite.fixtures().violatedExpiredScenario();
            const groups = await suite.repository().findGroupsViolatedByAccount({
                roles: scenario.candidateRoles.map(({ id }) => id),
                account: scenario.account,
                realm: scenario.realm.id,
            });

            // Act
            const result = await suite.repository().hasGroupsViolatedByAccount({
                roles: scenario.candidateRoles.map(({ id }) => id),
                account: scenario.account,
                realm: scenario.realm.id,
            });

            // Assert
            expect(result).toBe(false);
            expect(groups.map(({ code }) => code).sort()).toEqual(scenario.expectedGroupCodes);
        });
    });

    describe("[Behavior] - account violations", () => {
        it("[case] - finds accounts violating a role conflict rule", async () => {
            // Arrange
            const scenario = await suite.fixtures().violatingAccountsScenario();
            const accounts = await suite.repository().findAccountsViolatingRule({
                identifiers: scenario.roles.map(({ id }) => id),
                maxAllowed: scenario.maxAllowed,
                realm: scenario.realm.id,
            });

            // Act
            const result = await suite.repository().hasAccountsViolatingRule({
                identifiers: scenario.roles.map(({ id }) => id),
                maxAllowed: scenario.maxAllowed,
                realm: scenario.realm.id,
            });

            // Assert
            expect(result).toBe(true);
            expect(accounts.map(({ account }) => account).sort()).toEqual(scenario.expectedAccounts);
        });
    });

    describe("[Method] - hasGroupsWithViolatingAccounts", () => {
        it("[case] - detects configured groups with violating accounts", async () => {
            // Arrange
            const scenario = await suite.fixtures().violatingGroupsScenario();

            // Act
            const result = await suite.repository().hasGroupsWithViolatingAccounts({
                groups: scenario.groups.map(({ id }) => id),
                realm: scenario.realm.id,
            });

            // Assert
            expect(result).toBe(scenario.expectedResult);
        });

        it("[case] - does not detect configured groups violated only by expired account assignments", async () => {
            // Arrange
            const scenario = await suite.fixtures().violatingGroupsExpiredScenario();

            // Act
            const result = await suite.repository().hasGroupsWithViolatingAccounts({
                groups: scenario.groups.map(({ id }) => id),
                realm: scenario.realm.id,
            });

            // Assert
            expect(result).toBe(scenario.expectedResult);
        });

        it("[case] - does not detect configured groups violated only by foreign-realm roles", async () => {
            // Arrange
            const scenario = await suite.fixtures().violatingGroupsRealmScenario();

            // Act
            const result = await suite.repository().hasGroupsWithViolatingAccounts({
                groups: scenario.groups.map(({ id }) => id),
                realm: scenario.realm.id,
            });

            // Assert
            expect(result).toBe(scenario.expectedResult);
        });
    });

    describe("[Method] - wouldExceedGroupLimit", () => {
        it("[case] - checks active conflict group count limit per realm", async () => {
            // Arrange
            const scenario = await suite.fixtures().limitScenario();

            // Act
            const result = await suite.repository().wouldExceedGroupLimit({ realm: scenario.realm.id });

            const result2 = await suite.repository().wouldExceedGroupLimit({ realm: scenario.realm.id, count: 2 });

            // Assert
            expect(result).toBe(scenario.expectedCountOneResult);
            expect(result2).toBe(scenario.expectedCountTwoResult);
        });
    });
});
