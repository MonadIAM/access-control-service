import { EventPattern, Payload } from "@nestjs/microservices";
import { Controller, Inject } from "@nestjs/common";

import { BLACKLIST_CACHE_SERVICE } from "~context/infrastructure/services";
import { KafkaTopic } from "~context/enums";

@Controller()
export class BlacklistConsumer implements Consumers.Blacklist.Contract {
    public constructor(
        @Inject(BLACKLIST_CACHE_SERVICE)
        private readonly blacklistCacheService: InfrastructureServices.BlacklistCache.Contract,
    ) {}

    @EventPattern(KafkaTopic.BLACKLIST)
    public async handle(@Payload() message: Consumers.Props): Promise<void> {
        const payload: Consumers.Blacklist.Handle = JSON.parse(message.payload);

        await this.blacklistCacheService.set({
            sessionId: payload.sessionId,
            ttl: payload.ttl,
        });
    }
}
