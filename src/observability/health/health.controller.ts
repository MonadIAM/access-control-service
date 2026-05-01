import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { HealthCheck } from "@nestjs/terminus";

import { MonitoringInterceptor } from "~common/interceptors/monitoring.interceptor";
import { SkipInterceptors, Public } from "~common/decorators";

import { HealthService } from "./health.service";

@ApiTags("Health")
@SkipInterceptors()
@Controller("health")
@UseInterceptors(MonitoringInterceptor)
export class HealthController {
    public constructor(private readonly healthService: HealthService) {}

    @Public()
    @HealthCheck()
    @Get("liveness")
    @ApiOperation({ summary: "Returns basic liveness status confirming the service process is running" })
    public liveness(): Health.Liveness {
        return this.healthService.liveness();
    }

    @Public()
    @HealthCheck()
    @Get("readiness")
    @ApiOperation({ summary: "Checks database, Redis, and Kafka availability, returning per-component readiness status" })
    public readiness(): Promise<Health.Readiness> {
        return this.healthService.readiness();
    }
}
