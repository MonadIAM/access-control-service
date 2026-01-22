import { Global, Module } from "@nestjs/common";

import { rpsProvider, durationProvider } from "./metrics.providers";

@Global()
@Module({
    providers: [rpsProvider, durationProvider],
    exports: [rpsProvider, durationProvider],
})
export class MetricsModule {}
