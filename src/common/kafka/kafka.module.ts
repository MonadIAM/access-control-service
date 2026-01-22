import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { Module } from "@nestjs/common";

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
    exports: [ClientsModule],
})
export class KafkaModule {}
