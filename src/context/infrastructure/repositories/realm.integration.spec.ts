import { describe, expect, it } from "@jest/globals";
import { ConfigService } from "@nestjs/config";

import { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { RealmFixture } from "~testing/integration/repositories/realm.fixture";

function createRepositoryConfig(): ConfigService {
    return new ConfigService({
        REALM_LIMIT: 3,
    });
}

describe("[Repository] - Realm", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RealmRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RealmFixture(entityManager),
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - maps the persisted realm through the schema", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({
                description: "Mapping realm description",
                name: "Mapping Realm",
                code: "mapping.realm",
                isSystemManaged: true,
                isRevoked: true,
            });

            // Act
            const result = await suite.repository().findUniqueOrThrow({ where: { id: realm.id } });

            // Assert
            expect(result).toMatchObject({
                description: "Mapping realm description",
                createdAt: realm.createdAt,
                version: realm.version,
                isSystemManaged: true,
                name: "Mapping Realm",
                code: "mapping.realm",
                owner: realm.owner,
                isRevoked: true,
                id: realm.id,
            });
        });
    });

    describe("[Method] - getLookupList", () => {
        it("[case] - returns lookup page scoped to allowed realms", async () => {
            // Arrange
            const scenario = await suite.fixtures().lookupScenario();

            // Act
            const [realms, total] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 2 },
                realms: scenario.realms.map(({ id }) => id),
                term: "",
            });

            // Assert
            expect(total).toBe(scenario.expectedTotal);
            expect(realms.map(({ code }) => code)).toEqual(scenario.expectedFirstPageCodes);
        });

        it("[case] - uses trigram similarity lookup with stable tie-breakers", async () => {
            // Arrange
            const scenario = await suite.fixtures().lookupSearchScenario();

            // Act
            const [realms] = await suite.repository().getLookupList({
                pagination: { currentPage: 1, elementsPerPage: 10 },
                realms: scenario.realms.map(({ id }) => id),
                term: scenario.term,
            });

            // Assert
            expect(realms.map(({ code }) => code)).toEqual(scenario.expectedCodes);
        });
    });

    describe("[Method] - wouldExceedRealmLimit", () => {
        it("[case] - checks realm count limit per owner", async () => {
            // Arrange
            const scenario = await suite.fixtures().limitScenario();

            // Act
            const result = await suite.repository().wouldExceedRealmLimit({ account: scenario.account });

            const result2 = await suite.repository().wouldExceedRealmLimit({ account: scenario.account, count: 2 });

            // Assert
            expect(result).toBe(scenario.expectedCountOneResult);
            expect(result2).toBe(scenario.expectedCountTwoResult);
        });
    });
});
