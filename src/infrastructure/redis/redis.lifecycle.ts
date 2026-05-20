import { Inject, Injectable, OnApplicationShutdown, Logger } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CACHE_CLIENT, REDIS_LIMITER_CLIENT, REDIS_QUEUE_CLIENT } from "./tokens";

@Injectable()
export class RedisLifecycle implements OnApplicationShutdown {
    private readonly logger = new Logger(RedisLifecycle.name);

    public constructor(
        @Inject(REDIS_CACHE_CLIENT) private readonly cache: Redis,
        @Inject(REDIS_LIMITER_CLIENT) private readonly limiter: Redis,
        @Inject(REDIS_QUEUE_CLIENT) private readonly queue: Redis,
    ) {}

    public async onApplicationShutdown(): Promise<void> {
        const clients = [
            { name: "Cache", instance: this.cache },
            { name: "Limiter", instance: this.limiter },
            { name: "Queue", instance: this.queue },
        ];

        await Promise.all(
            clients.map(async ({ name, instance }) => {
                try {
                    await instance.quit();
                    this.logger.log(`Redis ${name} closed gracefully`);
                } catch (error) {
                    this.logger.warn(`Redis ${name} forced disconnect: ${error}`);
                    instance.disconnect(false);
                }
            }),
        );
    }
}
