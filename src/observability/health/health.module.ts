import { TerminusModule } from "@nestjs/terminus";
import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";

import { KafkaHealthIndicator } from "~infrastructure/kafka/kafka.health";
import { DatabaseHealthIndicator } from "~infrastructure/database/database.health";
import { RedisHealthIndicator } from "~infrastructure/redis/redis.health";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
    imports: [TerminusModule, ConfigModule],
    controllers: [HealthController],
    providers: [KafkaHealthIndicator, DatabaseHealthIndicator, RedisHealthIndicator, HealthService],
})
export class HealthModule {}
