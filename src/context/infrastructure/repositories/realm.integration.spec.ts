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

describe("RealmRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new RealmRepository(readManager, createRepositoryConfig()),
        fixture: (entityManager) => new RealmFixture(entityManager),
    });

    it("maps the persisted realm through the schema", async () => {
        const realm = await suite.fixtures().createRealm({
            description: "Mapping realm description",
            name: "Mapping Realm",
            code: "mapping.realm",
            isSystemManaged: true,
            isRevoked: true,
        });

        await expect(suite.repository().findUniqueOrThrow({ where: { id: realm.id } })).resolves.toMatchObject({
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

    it("returns lookup page scoped to allowed realms", async () => {
        const scenario = await suite.fixtures().lookupScenario();

        const [realms, total] = await suite.repository().getLookupList({
            pagination: { currentPage: 1, elementsPerPage: 2 },
            realms: scenario.realms.map(({ id }) => id),
            term: "",
        });

        expect(total).toBe(scenario.expectedTotal);
        expect(realms.map(({ code }) => code)).toEqual(scenario.expectedFirstPageCodes);
    });

    it("uses trigram similarity lookup with stable tie-breakers", async () => {
        const scenario = await suite.fixtures().lookupSearchScenario();

        const [realms] = await suite.repository().getLookupList({
            pagination: { currentPage: 1, elementsPerPage: 10 },
            realms: scenario.realms.map(({ id }) => id),
            term: scenario.term,
        });

        expect(realms.map(({ code }) => code)).toEqual(scenario.expectedCodes);
    });

    it("checks realm count limit per owner", async () => {
        const scenario = await suite.fixtures().limitScenario();

        await expect(suite.repository().wouldExceedRealmLimit({ account: scenario.account })).resolves.toBe(
            scenario.expectedCountOneResult,
        );
        await expect(suite.repository().wouldExceedRealmLimit({ account: scenario.account, count: 2 })).resolves.toBe(
            scenario.expectedCountTwoResult,
        );
    });
});
