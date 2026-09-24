import { SchemaRegistryResource } from "./schema-registry.resource";
import teardownPostgres from "./postgres.teardown";
import { RedisResource } from "./redis.resource";
import { KafkaResource } from "./kafka.resource";

export default async function teardown(): Promise<void> {
    const results = await Promise.allSettled([
        SchemaRegistryResource.stop(),
        KafkaResource.stop(),
        RedisResource.stop(),
        teardownPostgres(),
    ]);
    const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failures.length) {
        throw new AggregateError(
            failures.map(({ reason }) => reason),
            "Failed to stop integration containers",
        );
    }
}
