import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { Global, Module } from "@nestjs/common";

import { MetricsController } from "./metrics.controller";
import { KafkaMetricsRecorder } from "./kafka.recorder";
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
    providers: [...PROVIDERS, KafkaMetricsRecorder],
    exports: [...PROVIDERS, KafkaMetricsRecorder],
})
export class MetricsModule {}
