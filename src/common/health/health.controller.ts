import { Transport } from "@nestjs/microservices";
import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MicroserviceHealthIndicator, HealthCheckService, HealthCheckResult, HealthCheck } from "@nestjs/terminus";

import { MonitoringInterceptor } from "~common/interceptors/monitoring.interceptor";
import { DatabaseHealthIndicator } from "~infrastructure/database/database.health";
import { RedisHealthIndicator } from "~infrastructure/redis/redis.health";

@Controller("health")
@UseInterceptors(MonitoringInterceptor)
export class HealthController {
    public constructor(
        private microservice: MicroserviceHealthIndicator,
        private database: DatabaseHealthIndicator,
        private configService: ConfigService,
        private redis: RedisHealthIndicator,
        private health: HealthCheckService,
    ) {}

    @Get()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        return this.health.check([
            () => this.database.isHealthy<"database">("database"),
            () => this.redis.isHealthy<"redis">("redis"),
            () =>
                this.microservice.pingCheck("kafka", {
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            brokers: [this.configService.getOrThrow<string>("KAFKA_BROKER")],
                        },
                    },
                }),
        ]);
    }
}
