import { Injectable, Scope } from "@nestjs/common";
import { HealthIndicatorStatus, HealthCheckService } from "@nestjs/terminus";

import { DatabaseHealthIndicator } from "~infrastructure/database/database.health";
import { RedisHealthIndicator } from "~infrastructure/redis/redis.health";
import { KafkaHealthIndicator } from "~infrastructure/kafka/kafka.health";

@Injectable({ scope: Scope.DEFAULT })
export class HealthService {
    public constructor(
        private kafka: KafkaHealthIndicator,
        private database: DatabaseHealthIndicator,
        private redis: RedisHealthIndicator,
        private health: HealthCheckService,
    ) {}

    public liveness(): Health.Liveness {
        return { status: "ok" };
    }

    public async readiness(): Promise<Health.Readiness> {
        const result = await this.health.check([
            () => this.database.isHealthy<"database">("database"),
            () => this.redis.isHealthy<"redis">("redis"),
            () => this.kafka.isHealthy<"kafka">("kafka"),
        ]);

        const components: Record<string, HealthIndicatorStatus> = {};
        const entries = Object.typedEntries(result.details);

        for (const [key, value] of entries) {
            components[key] = value.status;
        }

        return {
            timestamp: new Date(),
            status: result.status,
            components,
        };
    }
}
