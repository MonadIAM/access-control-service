import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { SchemaRegistryClient, JsonSerializer, SerdeType, SubjectNameStrategyType } from "@confluentinc/schemaregistry";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import formats from "ajv-formats";
import { ConfigService } from "@nestjs/config";
import { AccountTopicAction, KafkaTopic } from "@monadiam/shared";
import { defer, from, lastValueFrom, retry as retryOperation, timeout } from "rxjs";
import { randomUUID } from "node:crypto";

import { SchemaRegistryResource } from "~testing/integration/containers/schema-registry.resource";
import { KafkaResource } from "~testing/integration/containers/kafka.resource";
import { Exception } from "~common/exceptions";

import { KafkaSchemaSerializer } from "./schema.serializer";
import { KafkaIncomingMapper } from "./incoming.mapper";
import { KafkaSchemaRegistry } from "./schema.registry";
import { KafkaRetryService } from "./retry.service";
import { KafkaClient } from "./client";
import { KafkaContext } from "./context";
import { KafkaServer } from "./server";
import { KafkaUtils } from "./utils";

function receive<T>(
    consumer: KafkaJS.Consumer,
    key: string,
    handler: (payload: KafkaJS.EachMessagePayload) => Promise<T>,
): Promise<T> {
    const result = new Promise<T>((resolve, reject) => {
        void consumer
            .run({
                eachMessage: async (payload) => {
                    if (payload.message.key?.toString() === key) {
                        try {
                            resolve(await handler(payload));
                        } catch (error) {
                            reject(error);
                        }
                    }
                },
            })
            .catch(reject);
    });
    return lastValueFrom(from(result).pipe(timeout(20_000)));
}

describe("[Infrastructure] - Kafka", () => {
    const topic = Object.values(KafkaTopic)[0];
    let kafka: KafkaJS.Kafka;
    let producer: KafkaJS.Producer;
    let consumer: KafkaJS.Consumer;
    let registry: KafkaSchemaRegistry;
    let serializer: KafkaSchemaSerializer;
    let schemaId: number;
    let remote: SchemaRegistryClient;
    let retry: Optional<KafkaRetryService>;
    let client: Optional<KafkaClient>;
    let server: Optional<KafkaServer>;

    beforeAll(async () => {
        kafka = new KafkaJS.Kafka({
            ...KafkaUtils.buildClientConfig(KafkaResource.config(), { withClientId: true }),
            kafkaJS: {
                ...KafkaUtils.buildClientConfig(KafkaResource.config(), { withClientId: true }).kafkaJS,
                logLevel: KafkaJS.logLevel.NOTHING,
            },
        });
        const admin = kafka.admin();
        try {
            await admin.connect();
            await admin.createTopics({ topics: [{ topic, numPartitions: 1, replicationFactor: 1 }] });
            await lastValueFrom(
                defer(async () => {
                    const metadata = await admin.fetchTopicMetadata({ topics: [topic], timeout: 1000 });
                    expect(metadata).toHaveLength(1);
                    expect(metadata[0].partitions).toHaveLength(1);
                    expect(metadata[0].partitions[0].partitionErrorCode).toBe(0);
                    expect(metadata[0].partitions[0].leader).toBeGreaterThanOrEqual(0);
                }).pipe(retryOperation({ count: 20, delay: 100 }), timeout(5000)),
            );
        } finally {
            await admin.disconnect();
        }
        remote = new SchemaRegistryClient({ baseURLs: [SchemaRegistryResource.url()] });
        schemaId = await remote.register(`${topic}-value`, {
            schemaType: "JSON",
            schema: JSON.stringify({ type: "object", required: ["id"], properties: { id: { type: "string" } } }),
        });
        registry = new KafkaSchemaRegistry(
            new ConfigService({
                SCHEMA_REGISTRY_URL: SchemaRegistryResource.url(),
                SCHEMA_REGISTRY_ENABLED: true,
            }),
        );
        await registry.onApplicationBootstrap();
        serializer = new KafkaSchemaSerializer(registry);
        producer = kafka.producer({ "message.timeout.ms": 10_000 });
        await producer.connect();
    });

    beforeEach(async () => {
        consumer = kafka.consumer({ kafkaJS: { groupId: `integration-${randomUUID()}`, fromBeginning: true } });
        await consumer.connect();
        await consumer.subscribe({ topic });
    });

    afterEach(async () => {
        retry?.onModuleDestroy();
        retry = undefined;
        await server?.close();
        server = undefined;
        await client?.close();
        client = undefined;
        await consumer?.disconnect();
    });

    afterAll(async () => {
        await producer?.disconnect();
        await registry?.onApplicationShutdown();
        await remote?.close();
    });

    describe("[Behavior] - message delivery", () => {
        it("[case] - delivers an encoded message with key and headers and decodes it using the registered schema", async () => {
            // Arrange
            const id = randomUUID();

            // Act
            const message = await serializer.serialize(
                { key: id, value: { id }, headers: { source: "integration" } },
                { pattern: topic },
            );
            const result = receive(consumer, id, async ({ message, partition, topic: receivedTopic }) => {
                const decoded = await registry.decode<{ id: string }>({ topic: receivedTopic, value: message.value });
                registry.validate({ topic: receivedTopic, value: decoded });
                const mapped = new KafkaIncomingMapper().map({
                    consumerKey: "integration",
                    context: { getMessage: () => message, getTopic: () => receivedTopic, getPartition: () => partition },
                });
                return { decoded, mapped, header: message.headers?.source?.toString(), value: message.value };
            });
            const [received] = await Promise.all([result, producer.send({ topic, messages: [message] })]);

            // Assert
            expect(received.decoded).toEqual({ id });
            expect(received.mapped).toMatchObject({
                event: id,
                consumerKey: "integration",
                source: { topic, partition: 0 },
            });
            expect(received.header).toBe("integration");
            expect(received.value?.readUInt8(0)).toBe(0);
            expect(received.value?.readUInt32BE(1)).toBe(schemaId);
            expect(received.value?.subarray(5).toString()).toBe(JSON.stringify({ id }));
        });
    });

    describe("[Behavior] - Nest transport", () => {
        it("[case] - retries a failed observable before advancing the partition and awaits delivery acknowledgements", async () => {
            // Arrange
            const first = randomUUID();
            const second = randomUUID();
            const attempts: { key: string; offset: string; value: unknown }[] = [];
            const config = KafkaUtils.buildClientConfig(KafkaResource.config(), { withClientId: true });
            client = new KafkaClient(config, serializer);
            server = new KafkaServer(config, { groupId: `transport-${randomUUID()}`, fromBeginning: true }, 1);
            let complete: () => void;
            const received = new Promise<void>((resolve) => {
                complete = resolve;
            });
            server.addHandler(
                topic,
                (value: unknown, context: KafkaContext) =>
                    Promise.resolve(
                        defer(() => {
                            const message = context.getMessage();
                            const key = message.key?.toString();
                            if (key === first || key === second) {
                                attempts.push({ key, offset: message.offset, value });
                                if (attempts.length === 1) {
                                    throw Exception.externalServiceFailed({ messageKey: "temporary" });
                                }
                                if (key === second) {
                                    complete();
                                }
                            }
                            return Promise.resolve();
                        }),
                    ),
                true,
            );

            // Act
            await new Promise<void>((resolve, reject) => {
                void server!.listen((error) => (error ? reject(error) : resolve()));
            });
            await client.check();
            const acknowledged = await lastValueFrom(client.emit(topic, { key: first, value: { id: first } }));
            await lastValueFrom(client.emit(topic, { key: second, value: { id: second } }));
            await lastValueFrom(from(received).pipe(timeout(20_000)));

            // Assert
            expect(server.isReady()).toBe(true);
            expect(acknowledged).toHaveLength(1);
            expect(attempts).toHaveLength(3);
            expect(attempts[0].key).toBe(first);
            expect(attempts[1]).toEqual(attempts[0]);
            expect(attempts[2].key).toBe(second);
            expect(await registry.decode({ topic, value: attempts[0].value })).toEqual({ id: first });
        });
    });

    describe("[Behavior] - schema validation", () => {
        it("[case] - preserves shared JSON Schema and UUID constraints", async () => {
            // Arrange
            const sharedTopic = `${topic}.shared`;
            const schema = readFileSync(
                join(process.cwd(), "node_modules/@monadiam/shared/src/kafka/account.schema.json"),
                "utf8",
            );
            await remote.register(`${sharedTopic}-value`, { schemaType: "JSON", schema });
            const encoder = new JsonSerializer(remote, SerdeType.VALUE, {
                useLatestVersion: true,
                subjectNameStrategyType: SubjectNameStrategyType.TOPIC,
                autoRegisterSchemas: false,
                validate: true,
                strict: false,
                formats: { uuid: formats.get("uuid") },
            });
            const value = {
                actionType: AccountTopicAction.EMAIL_VERIFIED,
                payload: {
                    account: randomUUID(),
                    identifier: { id: randomUUID(), type: "email", value: "user@example.test" },
                },
            };

            // Act
            const encoded = await encoder.serialize(sharedTopic, value);
            const decoded = await registry.decode({ topic: sharedTopic, value: encoded });
            const invalid = encoder.serialize(sharedTopic, {
                ...value,
                payload: { ...value.payload, identifier: { ...value.payload.identifier, id: "invalid" } },
            });

            // Assert
            expect(decoded).toEqual(value);
            await expect(invalid).rejects.toThrow();
        });

        it("[case] - rejects invalid payloads against a schema fetched from the real registry", async () => {
            // Arrange

            // Act
            const act = (): unknown => registry.validate({ topic, value: { id: 123 } });
            const result = registry.encode({ topic, value: { id: 123 } });

            // Assert
            expect(act).toThrow();
            await expect(result).rejects.toMatchObject({
                messageKey: "services.schema-registry.ENCODE_FAILED",
            });
        });
    });

    describe("[Method] - retry", () => {
        it("[case] - retries processing of a consumed message with the real consumer heartbeat", async () => {
            // Arrange
            const id = randomUUID();
            const attempts: string[] = [];
            const retries: string[] = [];
            retry = new KafkaRetryService(
                {
                    recordRetry: ({ topic: name }) => {
                        retries.push(name);
                    },
                    recordDead: () => {},
                },
                KafkaResource.config(),
            );

            // Act
            const message = await serializer.serialize({ key: id, value: { id } }, { pattern: topic });
            const result = receive(consumer, id, async ({ heartbeat, message }) => {
                await retry!.execute({
                    topic,
                    heartbeat,
                    process: () => {
                        attempts.push(message.offset);
                        return attempts.length === 1
                            ? Promise.reject(Exception.externalServiceFailed({ messageKey: "temporary" }))
                            : Promise.resolve();
                    },
                    reject: (error) => Promise.reject(error),
                });
                return message.key?.toString();
            });
            const [result2] = await Promise.all([result, producer.send({ topic, messages: [message] })]);

            // Assert
            expect(result2).toBe(id);
            expect(attempts).toHaveLength(2);
            expect(attempts[0]).toBe(attempts[1]);
            expect(retries).toEqual([topic]);
        });
    });
});
