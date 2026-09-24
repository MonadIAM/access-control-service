import { SchemaRegistryResource } from "./schema-registry.resource";
import { RedisResource } from "./redis.resource";
import { KafkaResource } from "./kafka.resource";
import setupPostgres from "./postgres.setup";
import teardown from "./teardown";

export default async function setup(): Promise<void> {
    try {
        await setupPostgres();
        await RedisResource.start();
        await KafkaResource.start();
        await SchemaRegistryResource.start();
    } catch (error) {
        try {
            await teardown();
        } catch (cleanupError) {
            throw new AggregateError([error, cleanupError], "Integration setup and cleanup failed");
        }
        throw error;
    }
}
