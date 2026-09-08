import { PostgresResource } from "./postgres.resource";

/**
 * Jest global teardown hook that stops the PostgreSQL Testcontainer started by global setup.
 */
export default async function teardown(): Promise<void> {
    await PostgresResource.stop();
}
