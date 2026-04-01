import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { FormatResponseInterceptor } from "~common/interceptors";
import { TrackingModule } from "~common/tracking";

import { PermissionGuard, AuthGuard } from "./infrastructure/guards";
import { INFRASTRUCTURE_SERVICES } from "./infrastructure/services";
import { PROCESSORS, QUEUES } from "./infrastructure/queues";
import { REPOSITORIES } from "./infrastructure/repositories";
import { CONTROLLERS } from "./interface/controllers";
import { DOMAIN_SERVICES } from "./domain/services";
import { COMMANDS } from "./application/commands";
import { QUERIES } from "./application/queries";

@Module({
    imports: [TrackingModule, BullModule.registerQueue({ name: "permission-cache-invalidation" })],
    providers: [
        ...INFRASTRUCTURE_SERVICES,
        ...DOMAIN_SERVICES,
        ...REPOSITORIES,
        ...PROCESSORS,
        ...COMMANDS,
        ...QUERIES,
        ...QUEUES,
        PermissionGuard,
        AuthGuard,
        {
            provide: APP_INTERCEPTOR,
            useClass: FormatResponseInterceptor,
        },
        {
            provide: APP_GUARD,
            useExisting: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useExisting: PermissionGuard,
        },
    ],
    controllers: [...CONTROLLERS],
})
export class AccessControlModule {}
