import { Global, Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import { MicroserviceOptions } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";

import { KAFKA_CONFIG, KAFKA_SCHEMA_REGISTRY, KAFKA_RETRY_SERVICE, KAFKA_SERVICE, KAFKA_SERVER } from "./tokens";
import { KafkaSchemaSerializer } from "./schema.serializer";
import { KafkaSchemaRegistry } from "./schema.registry";
import { KafkaRetryService } from "./retry.service";
import { KafkaClient } from "./client";
import { KafkaServer } from "./server";
import { KafkaUtils } from "./utils";

@Global()
@Module({
    providers: [
        { provide: KAFKA_RETRY_SERVICE, useClass: KafkaRetryService },
        { provide: KAFKA_SCHEMA_REGISTRY, useClass: KafkaSchemaRegistry },
        {
            inject: [ConfigService, KAFKA_SCHEMA_REGISTRY],
            provide: KAFKA_SERVICE,
            useFactory: (config: ConfigService, schemaRegistry: Kafka.SchemaRegistry.Contract): KafkaClient =>
                new KafkaClient(
                    KafkaUtils.buildClientConfig(config, { withClientId: true }),
                    new KafkaSchemaSerializer(schemaRegistry),
                ),
        },
        {
            inject: [ConfigService],
            provide: KAFKA_SERVER,
            useFactory: (config: ConfigService): KafkaServer =>
                new KafkaServer(
                    KafkaUtils.buildClientConfig(config, { withClientId: true }),
                    { groupId: `${config.getOrThrow<string>("SERVICE_NAME")}-consumer-server` },
                    config.get<number>("KAFKA_PARTITIONS_CONSUMED_CONCURRENTLY", 1),
                ),
        },
        {
            provide: KAFKA_CONFIG,
            inject: [KAFKA_SERVER],
            useFactory: (strategy: KafkaServer): MicroserviceOptions => ({ strategy }),
        },
    ],
    exports: [KAFKA_RETRY_SERVICE, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE, KAFKA_CONFIG, KAFKA_SERVER],
})
export class KafkaModule implements OnApplicationShutdown {
    public constructor(@Inject(KAFKA_SERVICE) private readonly kafkaClient: KafkaClient) {}

    public async onApplicationShutdown(): Promise<void> {
        await this.kafkaClient.close();
    }
}
