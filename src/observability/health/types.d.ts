import { HealthCheckStatus, HealthIndicatorStatus } from "@nestjs/terminus";

declare global {
    namespace Health {
        type Liveness = {
            status: HealthCheckStatus;
        };

        type Readiness = {
            components: Record<string, HealthIndicatorStatus>;
            status: HealthCheckStatus;
            timestamp: Date;
        };
    }
}
