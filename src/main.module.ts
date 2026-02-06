import { APP_FILTER } from "@nestjs/core";
import { Module } from "@nestjs/common";

import { AccessControlModule } from "~context/access-control.module";
import { GlobalExceptionFilter } from "~common/exceptions";
import { InfrastructureModule } from "~infrastructure";
import { ObservabilityModule } from "~observability";
import { SystemModule } from "~common/system.module";

@Module({
    imports: [SystemModule, InfrastructureModule, ObservabilityModule, AccessControlModule],
    providers: [
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class MainModule {}
