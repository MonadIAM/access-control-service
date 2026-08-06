import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { REAUTHENTICATION_CACHE_SERVICE } from "~context/infrastructure/services";
import { KAFKA_SERVICE } from "~infrastructure/kafka";
import { KafkaTopic } from "~context/enums";

@Controller()
export class ReauthenticationConsumer implements Consumers.Reauthentication.Contract, OnModuleInit {
    public constructor(
        @Inject(REAUTHENTICATION_CACHE_SERVICE)
        private readonly reauthenticationCacheService: InfrastructureServices.ReauthenticationCache.PublicContract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.REAUTHENTICATION)
    public async handle(@Payload() message: Consumers.Reauthentication.Message): Consumers.Reauthentication.Handle.Result {
        try {
            const ttl = Math.floor((message.payload.expiresAt - Date.now()) / 1e3);
            if (ttl > 0) {
                await this.reauthenticationCacheService.set({ session: message.payload.session, ttl });
            }
        } catch (error) {
            await lastValueFrom(
                this.kafkaClient.emit(KafkaTopic.REAUTHENTICATION_RETRY, {
                    value: {
                        originalTopic: KafkaTopic.REAUTHENTICATION,
                        error: String(error),
                        payload: message,
                    },
                }),
            );
        }
    }
}
