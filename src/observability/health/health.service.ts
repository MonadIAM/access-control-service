import { Injectable, Scope } from "@nestjs/common";
import { Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import {
    MicroserviceHealthIndicator,
    HealthIndicatorStatus,
    HealthIndicatorResult,
    HealthCheckService,
} from "@nestjs/terminus";

import { DatabaseHealthIndicator } from "~infrastructure/database/database.health";
import { RedisHealthIndicator } from "~infrastructure/redis/redis.health";

@Injectable({ scope: Scope.DEFAULT })
export class HealthService {
    public constructor(
        private microservice: MicroserviceHealthIndicator,
        private database: DatabaseHealthIndicator,
        private redis: RedisHealthIndicator,
        private health: HealthCheckService,
        private config: ConfigService,
    ) {}

    public liveness(): Health.Liveness {
        return { status: "ok" };
    }

    public async readiness(): Promise<Health.Readiness> {
        const result = await this.health.check([
            () => this.database.isHealthy<"database">("database"),
            () => this.redis.isHealthy<"redis">("redis"),
            () => this.checkKafka(),
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

    private checkKafka(): Promise<HealthIndicatorResult<"kafka">> {
        return this.microservice.pingCheck("kafka", {
            transport: Transport.KAFKA,
            options: {
                client: {
                    brokers: [this.config.getOrThrow<string>("KAFKA_BROKER")],
                },
            },
        });
    }
}
