import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { BLACKLIST_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { KAFKA_SERVICE } from "~infrastructure/kafka";
import { KafkaTopic } from "~context/enums";

@Controller()
export class BlacklistConsumer implements Consumers.Blacklist.Contract, OnModuleInit {
    public constructor(
        @Inject(BLACKLIST_CACHE_SERVICE)
        private readonly blacklistCacheService: InfrastructureServices.BlacklistCache.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.BLACKLIST)
    public async handle(@Payload() message: Consumers.Blacklist.Payload): Promise<void> {
        try {
            await this.blacklistCacheService.set({
                sessionId: message.payload.sessionId,
                ttl: message.payload.ttl,
            });
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
