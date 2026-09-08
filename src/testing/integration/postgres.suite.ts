import { beforeAll, beforeEach, afterAll } from "@jest/globals";

import { PostgresResource } from "./postgres.resource";

export function postgresSuite<Repository, Fixture>(
    setup: Integration.Postgres.Suite.Setup<Repository, Fixture>,
): Integration.Postgres.Suite.Contract<Repository, Fixture> {
    let postgres: Optional<PostgresResource>;
    let repository: Optional<Repository>;
    let fixtures: Optional<Fixture>;

    beforeAll(async () => {
        postgres = await PostgresResource.connect();
    });

    beforeEach(async () => {
        const resource = requirePostgres(postgres);

        await resource.reset();
        repository = setup.repository({
            writeManager: resource.orm.em.fork(),
            readManager: resource.orm.em.fork(),
            orm: resource.orm,
        });
        fixtures = setup.fixture(resource.orm.em.fork());
    });

    afterAll(async () => {
        await postgres?.close();
    });

    return {
        transaction: async (callback) => await requirePostgres(postgres).orm.em.transactional(callback),
        repository: () => requireRepository(repository),
        fixtures: () => requireFixtures(fixtures),
    };
}

function requirePostgres(postgres: Optional<PostgresResource>): PostgresResource {
    if (postgres) {
        return postgres;
    } else {
        throw new Error("Postgres test resource is not started");
    }
}

function requireRepository<Repository>(repository: Optional<Repository>): Repository {
    if (repository) {
        return repository;
    } else {
        throw new Error("Integration test repository is not initialized");
    }
}

function requireFixtures<Fixture>(fixtures: Optional<Fixture>): Fixture {
    if (fixtures) {
        return fixtures;
    } else {
        throw new Error("Integration test fixtures are not initialized");
    }
}
