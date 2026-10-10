import { describe, expect, it } from "@jest/globals";
import { QueryOrder } from "@mikro-orm/postgresql";

import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { CoreFixture } from "~testing/integration/repositories/core.fixture";
import { PublicStringOperator } from "~infrastructure/database/enums";
import { RealmMapper } from "~context/infrastructure/mappers";
import { Realm } from "~context/domain/entities";

import { BaseRepository } from "./mixin";

class TestRepository extends BaseRepository<Entities.Realm, Repositories.Mappers.Realm.Types>({
    Mapper: RealmMapper,
    Entity: Realm,
}) {
    public constructor(protected readonly readManager: ORM.EntityManager) {
        super();
    }
}

describe("[Mixin] - BaseRepository", () => {
    const suite = postgresSuite({
        repository: ({ readManager }) => new TestRepository(readManager),
        fixture: (entityManager) => new CoreFixture(entityManager),
    });

    describe("[Method] - findUnique", () => {
        it("[case] - finds one entity or null by ORM where query", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "base.find-unique", name: "Base Find Unique" });

            // Act
            const result = await suite.repository().findUnique({ where: { id: realm.id } });

            const result2 = await suite.repository().findUnique({ where: { code: "missing" } });

            // Assert
            expect(result).toMatchObject({
                code: realm.code,
                id: realm.id,
            });
            expect(result2).toBeNull();
        });
    });

    describe("[Method] - findUniqueOrThrow", () => {
        it("[case] - finds one required entity by ORM where query", async () => {
            // Arrange
            const realm = await suite.fixtures().createRealm({ code: "base.find-unique-or-throw", name: "Base Required" });

            // Act
            const result = await suite.repository().findUniqueOrThrow({ where: { id: realm.id } });

            // Assert
            expect(result).toMatchObject({
                code: realm.code,
                id: realm.id,
            });
        });
    });

    describe("[Method] - find", () => {
        it("[case] - finds all entities matching an ORM where query", async () => {
            // Arrange
            await suite.fixtures().createRealm({ code: "base.find.first", name: "Base Find First", isSystemManaged: true });
            await suite
                .fixtures()
                .createRealm({ code: "base.find.second", name: "Base Find Second", isSystemManaged: true });
            await suite.fixtures().createRealm({ code: "base.find.external", name: "Base Find External" });

            // Act
            const realms = await suite.repository().find({ where: { isSystemManaged: true } });

            // Assert
            expect(realms.map(({ code }) => code).sort()).toEqual(["base.find.first", "base.find.second"]);
        });
    });

    describe("[Method] - findMany", () => {
        it("[case] - finds and counts entities using explicit ORM where and options", async () => {
            // Arrange
            await suite.fixtures().createRealm({ code: "base.find-many.alpha", name: "Alpha Realm" });
            await suite.fixtures().createRealm({ code: "base.find-many.beta", name: "Beta Realm" });

            // Act
            const [realms, total] = await suite.repository().findMany({
                where: { code: { $like: "base.find-many.%" } },
                options: { orderBy: { name: QueryOrder.ASC } },
            });

            // Assert
            expect(total).toBe(2);
            expect(realms.map(({ code }) => code)).toEqual(["base.find-many.alpha", "base.find-many.beta"]);
        });

        it("[case] - finds and counts entities using mapper filters, sort and pagination", async () => {
            // Arrange
            await suite.fixtures().createRealm({ code: "base.mapped.alpha", name: "Alpha Mapped Realm" });
            await suite.fixtures().createRealm({ code: "base.mapped.beta", name: "Beta Mapped Realm" });
            await suite.fixtures().createRealm({ code: "base.mapped.gamma", name: "Gamma Mapped Realm" });

            // Act
            const [realms, total] = await suite.repository().findMany({
                filters: { code: { operator: PublicStringOperator.ILIKE, value: "base.mapped." } },
                pagination: { currentPage: 1, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
            });

            // Assert
            expect(total).toBe(3);
            expect(realms).toHaveLength(2);
            expect(realms.every(({ code }) => code.startsWith("base.mapped."))).toBe(true);
        });

        it("[case] - keeps mapper pagination stable when creation timestamps are equal", async () => {
            // Arrange
            const createdAt = new Date("2026-01-01T00:00:00.000Z");
            const first = await suite.fixtures().createRealm({ code: "base.stable.first", createdAt });
            const second = await suite.fixtures().createRealm({ code: "base.stable.second", createdAt });
            const third = await suite.fixtures().createRealm({ code: "base.stable.third", createdAt });
            const expectedIDs = [first, second, third]
                .sort((left, right) => left.id.localeCompare(right.id))
                .map(({ id }) => id);

            // Act
            const [firstPage, total] = await suite.repository().findMany({
                filters: { code: { operator: PublicStringOperator.ILIKE, value: "base.stable." } },
                pagination: { currentPage: 1, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
            });
            const [secondPage] = await suite.repository().findMany({
                filters: { code: { operator: PublicStringOperator.ILIKE, value: "base.stable." } },
                pagination: { currentPage: 2, elementsPerPage: 2 },
                sort: { createdAt: QueryOrder.ASC },
            });

            // Assert
            expect(total).toBe(expectedIDs.length);
            expect([...firstPage, ...secondPage].map(({ id }) => id)).toEqual(expectedIDs);
        });

        it("[case] - finds and counts entities using mapper filters combined with prefilter", async () => {
            // Arrange
            await suite.fixtures().createRealm({ code: "base.prefilter.managed", isSystemManaged: true });
            await suite.fixtures().createRealm({ code: "base.prefilter.external" });
            await suite.fixtures().createRealm({ code: "other.prefilter.managed", isSystemManaged: true });

            // Act
            const [realms, total] = await suite.repository().findMany({
                filters: { code: { operator: PublicStringOperator.ILIKE, value: "base.prefilter." } },
                pagination: { currentPage: 1, elementsPerPage: 10 },
                prefilter: { isSystemManaged: true },
                sort: { createdAt: QueryOrder.ASC },
            });

            // Assert
            expect(total).toBe(1);
            expect(realms[0]?.code).toBe("base.prefilter.managed");
        });
    });
});
