import { HealthIndicatorResult, HealthIndicatorService } from "@nestjs/terminus";
import { Injectable, Inject } from "@nestjs/common";
import { Redis } from "ioredis";

import { REDIS_CACHE_CLIENT, REDIS_LIMITER_CLIENT, REDIS_QUEUE_CLIENT } from "./tokens";

@Injectable()
export class RedisHealthIndicator {
    public constructor(
        private readonly healthIndicatorService: HealthIndicatorService,
        @Inject(REDIS_LIMITER_CLIENT) private readonly limiter: Redis,
        @Inject(REDIS_CACHE_CLIENT) private readonly cache: Redis,
        @Inject(REDIS_QUEUE_CLIENT) private readonly queue: Redis,
    ) {}

    public async isHealthy<T extends string>(key: T): Promise<HealthIndicatorResult<T>> {
        const indicator = this.healthIndicatorService.check(key);

        try {
            const [limiterRes, cacheRes, queueRes] = await Promise.all([
                this.limiter.ping(),
                this.cache.ping(),
                this.queue.ping(),
            ]);

            const isAllOk = cacheRes === "PONG" && limiterRes === "PONG" && queueRes === "PONG";

            if (isAllOk) {
                return indicator.up();
            } else {
                return indicator.down({
                    limiter: limiterRes,
                    cache: cacheRes,
                    queue: queueRes,
                });
            }
        } catch (error) {
            return indicator.down({ message: error });
        }
    }
}
