import { EventPattern, Payload } from "@nestjs/microservices";
import { Controller, Inject } from "@nestjs/common";

import { BLACKLIST_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { KafkaTopic } from "~context/enums";

@Controller()
export class BlacklistConsumer implements Consumers.Blacklist.Contract {
    public constructor(
        @Inject(BLACKLIST_CACHE_SERVICE)
        private readonly blacklistCacheService: InfrastructureServices.BlacklistCache.Contract,
    ) {}

    @EventPattern(KafkaTopic.BLACKLIST)
    public async handle(@Payload() { payload }: Consumers.Blacklist.Payload): Promise<void> {
        await this.blacklistCacheService.set({
            sessionId: payload.sessionId,
            ttl: payload.ttl,
        });
    }
}
