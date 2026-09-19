import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { Global, Module } from "@nestjs/common";

import { MetricsController } from "./metrics.controller";
import { KafkaMetricsRecorder } from "./kafka.recorder";
import { KAFKA_METRICS_RECORDER } from "./tokens";
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
    providers: [
        {
            provide: KAFKA_METRICS_RECORDER,
            useClass: KafkaMetricsRecorder,
        },
        ...PROVIDERS,
    ],
    exports: [KAFKA_METRICS_RECORDER, ...PROVIDERS],
})
export class MetricsModule {}
