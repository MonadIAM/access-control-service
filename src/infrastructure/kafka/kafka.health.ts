import { HealthIndicatorResult, HealthIndicatorService } from "@nestjs/terminus";
import { Injectable, Inject } from "@nestjs/common";

import { KAFKA_SERVICE, KAFKA_SERVER } from "./tokens";
import { KafkaClient } from "./client";
import { KafkaServer } from "./server";

@Injectable()
export class KafkaHealthIndicator {
    public constructor(
        private readonly healthIndicatorService: HealthIndicatorService,
        @Inject(KAFKA_SERVICE) private readonly client: KafkaClient,
        @Inject(KAFKA_SERVER) private readonly server: KafkaServer,
    ) {}

    public async isHealthy<T extends string>(key: T): Promise<HealthIndicatorResult<T>> {
        const indicator = this.healthIndicatorService.check(key);
        try {
            if (!this.server.isReady()) {
                return indicator.down();
            }
            await this.client.check();
            return indicator.up();
        } catch (error) {
            return indicator.down({ message: error });
        }
    }
}
