import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { BLACKLIST_CACHE_SERVICE } from "~context/infrastructure/services";
import { KAFKA_SERVICE } from "~infrastructure/kafka";
import { KafkaTopic } from "~context/enums";

@Controller()
export class BlacklistConsumer implements Consumers.Blacklist.Contract, OnModuleInit {
    public constructor(
        @Inject(BLACKLIST_CACHE_SERVICE)
        private readonly blacklistCacheService: InfrastructureServices.BlacklistCache.PublicContract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.BLACKLIST)
    public async handle(@Payload() message: Consumers.Blacklist.Message): Consumers.Blacklist.Handle.Result {
        try {
            const ttl = Math.floor((message.payload.expiresAt - Date.now()) / 1e3);
            if (ttl > 0) {
                await this.blacklistCacheService.set({ session: message.payload.session, ttl });
            }
        } catch (error) {
            await lastValueFrom(
                this.kafkaClient.emit(KafkaTopic.BLACKLIST_DEAD, {
                    value: {
                        originalTopic: KafkaTopic.BLACKLIST,
                        error: String(error),
                        payload: message,
                    },
                }),
            );
        }
    }
}
