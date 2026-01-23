import { ClientsModule, Transport, MicroserviceOptions } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { Module } from "@nestjs/common";

export const KAFKA_MICROSERVICE_CONFIG = Symbol("KAFKA_MICROSERVICE_CONFIG");

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: "KAFKA_SERVICE",
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            clientId: config.getOrThrow("SERVICE_NAME"),
                            brokers: [config.getOrThrow("KAFKA_BROKER")],
                        },
                        consumer: {
                            groupId: `${config.getOrThrow("SERVICE_NAME")}-producer-client`,
                        },
                    },
                }),
            },
        ]),
    ],
    providers: [
        {
            provide: KAFKA_MICROSERVICE_CONFIG,
            inject: [ConfigService],
            useFactory: (config: ConfigService): MicroserviceOptions => ({
                transport: Transport.KAFKA,
                options: {
                    client: {
                        brokers: [config.getOrThrow("KAFKA_BROKER")],
                        retry: {
                            initialRetryTime: config.getOrThrow<number>("KAFKA_RETRY_INITIAL_TIME"),
                            retries: config.getOrThrow<number>("KAFKA_RETRY_ATTEMPTS"),
                        },
                    },
                    consumer: {
                        groupId: `${config.getOrThrow("SERVICE_NAME")}-consumer-server`,
                        allowAutoTopicCreation: true,
                    },
                },
            }),
        },
    ],
    exports: [ClientsModule, KAFKA_MICROSERVICE_CONFIG],
})
export class KafkaModule {}
