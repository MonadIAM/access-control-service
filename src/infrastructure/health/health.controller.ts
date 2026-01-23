import { Controller, Get, UseInterceptors } from "@nestjs/common";
import { HealthCheck } from "@nestjs/terminus";

import { MonitoringInterceptor } from "~common/interceptors/monitoring.interceptor";

import { HealthService } from "./health.service";

@Controller("health")
@UseInterceptors(MonitoringInterceptor)
export class HealthController {
    public constructor(private readonly healthService: HealthService) {}

    @HealthCheck()
    @Get("liveness")
    public liveness(): Health.Liveness {
        return this.healthService.liveness();
    }

    @HealthCheck()
    @Get("readiness")
    public readiness(): Promise<Health.Readiness> {
        return this.healthService.readiness();
    }
}
