import { APP_FILTER } from "@nestjs/core";
import { Module } from "@nestjs/common";

import { GlobalExceptionFilter } from "~common/exceptions";
import { SystemModule } from "~common/system.module";
import { InfrastructureModule } from "~infrastructure";
import { ObservabilityModule } from "~observability";
@Module({
    imports: [SystemModule, InfrastructureModule, ObservabilityModule],
    providers: [
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule {}
