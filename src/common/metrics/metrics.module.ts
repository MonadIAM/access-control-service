import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { Global, Module } from "@nestjs/common";

import { rpsProvider, durationProvider } from "./metrics.providers";

@Global()
@Module({
    imports: [PrometheusModule.register({ path: "/metrics" })],
    providers: [rpsProvider, durationProvider],
    exports: [rpsProvider, durationProvider],
})
export class MetricsModule {}
