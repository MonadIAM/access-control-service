import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { Global, Module } from "@nestjs/common";

import { MetricsController } from "./metrics.controller";
import { PROVIDERS } from "./metrics.providers";

@Global()
@Module({
    imports: [
        PrometheusModule.register({
            defaultMetrics: { enabled: true },
            controller: MetricsController,
            path: "/metrics",
        }),
    ],
    providers: PROVIDERS,
    exports: PROVIDERS,
})
export class MetricsModule {}
