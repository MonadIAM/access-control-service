import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { Global, Module } from "@nestjs/common";

import { POVIDERS } from "./metrics.providers";

@Global()
@Module({
    imports: [
        PrometheusModule.register({
            path: "/metrics",
            defaultMetrics: {
                enabled: true,
            },
        }),
    ],
    providers: POVIDERS,
    exports: POVIDERS,
})
export class MetricsModule {}
