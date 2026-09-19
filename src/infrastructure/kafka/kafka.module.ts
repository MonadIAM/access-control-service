import { ClientKafka, MicroserviceOptions, Transport } from "@nestjs/microservices";
import { Global, Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { KAFKA_CONFIG, KAFKA_SCHEMA_REGISTRY, KAFKA_RETRY_SERVICE, KAFKA_SERVICE } from "./tokens";
import { KafkaSchemaSerializer } from "./schema.serializer";
import { KafkaSchemaRegistry } from "./schema.registry";
import { KafkaRetryService } from "./retry.service";
import { KafkaUtils } from "./utils";

@Global()
@Module({
    providers: [
        {
            provide: KAFKA_RETRY_SERVICE,
            useClass: KafkaRetryService,
        },
        {
            provide: KAFKA_SCHEMA_REGISTRY,
            useClass: KafkaSchemaRegistry,
        },
        {
            inject: [ConfigService, KAFKA_SCHEMA_REGISTRY],
            provide: KAFKA_SERVICE,
            useFactory: (config: ConfigService, schemaRegistry: Kafka.SchemaRegistry.Contract): ClientKafka =>
                new ClientKafka({
                    consumer: { groupId: `${config.getOrThrow<string>("SERVICE_NAME")}-producer` },
                    client: KafkaUtils.buildClientConfig(config, { withClientId: true }),
                    serializer: new KafkaSchemaSerializer(schemaRegistry),
                }),
        },
        {
            provide: KAFKA_CONFIG,
            inject: [ConfigService],
            useFactory: (config: ConfigService): MicroserviceOptions => ({
                transport: Transport.KAFKA,
                options: {
                    client: {
                        ...KafkaUtils.buildClientConfig(config),
                        retry: {
                            initialRetryTime: ms(config.getOrThrow<StringValue>("KAFKA_RETRY_INITIAL_TIME")),
                            retries: config.getOrThrow<number>("KAFKA_RETRY_ATTEMPTS"),
                        },
                    },
                    consumer: {
                        groupId: `${config.getOrThrow<string>("SERVICE_NAME")}-consumer`,
                        allowAutoTopicCreation: false,
                    },
                    run: {
                        partitionsConsumedConcurrently: config.getOrThrow<number>("KAFKA_PARTITIONS_CONSUMED_CONCURRENTLY"),
                    },
                },
            }),
        },
    ],
    exports: [KAFKA_RETRY_SERVICE, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE, KAFKA_CONFIG],
})
export class KafkaModule implements OnApplicationShutdown {
    public constructor(
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onApplicationShutdown(): Promise<void> {
        await this.kafkaClient.close();
    }
}
