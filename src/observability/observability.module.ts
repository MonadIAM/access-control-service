import { Module } from "@nestjs/common";

import { MetricsModule } from "./metrics";
import { HealthModule } from "./health";
import { LoggerModule } from "./logger";

@Module({
    imports: [LoggerModule, MetricsModule, HealthModule],
    exports: [LoggerModule, MetricsModule, HealthModule],
})
export class ObservabilityModule {}
