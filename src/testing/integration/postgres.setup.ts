import { PostgresResource } from "./postgres.resource";

/**
 * Jest global setup hook that starts one PostgreSQL Testcontainer for the full integration suite.
 */
export default async function setup(): Promise<void> {
    const postgres = await PostgresResource.start();
    await postgres.close();
}
