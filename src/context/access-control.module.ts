import { BullModule } from "@nestjs/bullmq";
import { APP_GUARD } from "@nestjs/core";
import { Module } from "@nestjs/common";

import { PermissionGuard, AuthGuard } from "./infrastructure/guards";
import { INFRASTRUCTURE_SERVICES } from "./infrastructure/services";
import { PROCESSORS, QUEUES } from "./infrastructure/queues";
import { REPOSITORIES } from "./infrastructure/repositories";
import { OPERATIONS } from "./application/operations";
import { CONTROLLERS } from "./interface/controllers";
import { DOMAIN_SERVICES } from "./domain/services";

@Module({
    imports: [BullModule.registerQueue({ name: "permission-cache-invalidation" })],
    providers: [
        ...INFRASTRUCTURE_SERVICES,
        ...DOMAIN_SERVICES,
        ...REPOSITORIES,
        ...PROCESSORS,
        ...OPERATIONS,
        ...QUEUES,
        PermissionGuard,
        AuthGuard,
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
