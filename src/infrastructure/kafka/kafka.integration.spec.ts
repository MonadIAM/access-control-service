import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { Consumer, EachMessagePayload, Kafka, logLevel, Producer } from "kafkajs";
import { SchemaRegistry, SchemaType } from "@kafkajs/confluent-schema-registry";
import { ConfigService } from "@nestjs/config";
import { KafkaTopic } from "@monadiam/shared";
import { randomUUID } from "node:crypto";

import { SchemaRegistryResource } from "~testing/integration/containers/schema-registry.resource";
import { KafkaResource } from "~testing/integration/containers/kafka.resource";
import { Exception } from "~common/exceptions";

import { KafkaSchemaSerializer } from "./schema.serializer";
import { KafkaIncomingMapper } from "./incoming.mapper";
import { KafkaSchemaRegistry } from "./schema.registry";
import { KafkaRetryService } from "./retry.service";
import { KafkaUtils } from "./utils";

function receive<T>(consumer: Consumer, key: string, handler: (payload: EachMessagePayload) => Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout;
    const result = new Promise<T>((resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Kafka message was not received within 20 seconds")), 20_000);
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
    return result.finally(() => clearTimeout(timer));
}

describe("Kafka infrastructure with broker and Schema Registry", () => {
    const topic = Object.values(KafkaTopic)[0];
    let kafka: Kafka;
    let producer: Producer;
    let consumer: Consumer;
    let registry: KafkaSchemaRegistry;
    let serializer: KafkaSchemaSerializer;
    let retry: Optional<KafkaRetryService>;

    beforeAll(async () => {
        kafka = new Kafka({
            ...KafkaUtils.buildClientConfig(KafkaResource.config(), { withClientId: true }),
            logLevel: logLevel.NOTHING,
        });
        const admin = kafka.admin();
        try {
            await admin.connect();
            await admin.createTopics({ topics: [{ topic, numPartitions: 1, replicationFactor: 1 }], waitForLeaders: true });
        } finally {
            await admin.disconnect();
        }
        const remote = new SchemaRegistry({ host: SchemaRegistryResource.url() });
        await remote.register(
            {
                type: SchemaType.AVRO,
                schema: JSON.stringify({
                    type: "record",
                    name: "IntegrationEvent",
                    fields: [{ name: "id", type: "string" }],
                }),
            },
            { subject: `${topic}-value` },
        );
        registry = new KafkaSchemaRegistry(
            new ConfigService({
                SCHEMA_REGISTRY_URL: SchemaRegistryResource.url(),
                SCHEMA_REGISTRY_ENABLED: true,
            }),
        );
        await registry.onApplicationBootstrap();
        serializer = new KafkaSchemaSerializer(registry);
        producer = kafka.producer();
        await producer.connect();
    });

    beforeEach(async () => {
        consumer = kafka.consumer({ groupId: `integration-${randomUUID()}` });
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: true });
    });

    afterEach(async () => {
        retry?.onModuleDestroy();
        retry = undefined;
        await consumer?.disconnect();
    });

    afterAll(async () => {
        await producer?.disconnect();
    });

    it("delivers an encoded message with key and headers and decodes it using the registered schema", async () => {
        const id = randomUUID();
        const result = receive(consumer, id, async ({ message, partition, topic: receivedTopic }) => {
            const decoded = await registry.decode<{ id: string }>({ topic: receivedTopic, value: message.value });
            registry.validate({ topic: receivedTopic, value: decoded });
            const mapped = new KafkaIncomingMapper().map({
                consumerKey: "integration",
                context: { getMessage: () => message, getTopic: () => receivedTopic, getPartition: () => partition },
            });
            return { decoded, mapped, header: message.headers?.source?.toString(), value: message.value };
        });
        const message = await serializer.serialize(
            { key: id, value: { id }, headers: { source: "integration" } },
            { pattern: topic },
        );
        await producer.send({ topic, messages: [message] });
        const received = await result;
        expect(received.decoded).toEqual({ id });
        expect(received.mapped).toMatchObject({ event: id, consumerKey: "integration", source: { topic, partition: 0 } });
        expect(received.header).toBe("integration");
        expect(received.value?.readUInt8(0)).toBe(0);
    });

    it("rejects invalid payloads against a schema fetched from the real registry", async () => {
        expect(() => registry.validate({ topic, value: { id: 123 } })).toThrow();
        await expect(registry.encode({ topic, value: { id: 123 } })).rejects.toMatchObject({
            messageKey: "services.schema-registry.ENCODE_FAILED",
        });
    });

    it("retries processing of a consumed message with the real consumer heartbeat", async () => {
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
        const message = await serializer.serialize({ key: id, value: { id } }, { pattern: topic });
        await producer.send({ topic, messages: [message] });
        expect(await result).toBe(id);
        expect(attempts).toHaveLength(2);
        expect(attempts[0]).toBe(attempts[1]);
        expect(retries).toEqual([topic]);
    });
});
