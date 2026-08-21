import { ClientsModule, Transport, MicroserviceOptions } from "@nestjs/microservices";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { KAFKA_SERVICE, KAFKA_CONFIG } from "./tokens";
import { KafkaUtils } from "./utils";

@Global()
@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: KAFKA_SERVICE,
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    transport: Transport.KAFKA,
                    options: {
                        consumer: { groupId: `${config.getOrThrow("SERVICE_NAME")}-producer` },
                        client: KafkaUtils.buildClientConfig(config, { withClientId: true }),
                    },
                }),
            },
        ]),
    ],
    providers: [
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
                        groupId: `${config.getOrThrow("SERVICE_NAME")}-consumer`,
                        allowAutoTopicCreation: false,
                    },
                },
            }),
        },
    ],
    exports: [ClientsModule, KAFKA_CONFIG],
})
export class KafkaModule {}
