import { TerminusModule } from "@nestjs/terminus";
import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";

import { DatabaseHealthIndicator } from "~infrastructure/database/database.health";
import { RedisHealthIndicator } from "~infrastructure/redis/redis.health";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
    imports: [TerminusModule, ConfigModule],
    controllers: [HealthController],
    providers: [DatabaseHealthIndicator, RedisHealthIndicator, HealthService],
})
export class HealthModule {}
