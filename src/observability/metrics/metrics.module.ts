import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { Global, Module } from "@nestjs/common";

import { MetricsController } from "./metrics.controller";
import { POVIDERS } from "./metrics.providers";

@Global()
@Module({
    imports: [
        PrometheusModule.register({
            defaultMetrics: { enabled: true },
            controller: MetricsController,
            path: "/metrics",
        }),
    ],
    providers: POVIDERS,
    exports: POVIDERS,
})
export class MetricsModule {}
