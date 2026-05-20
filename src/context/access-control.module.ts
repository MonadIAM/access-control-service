import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { TransactionManagerModule } from "~common/transaction-manager";
import { FormatResponseInterceptor } from "~common/interceptors";
import { COMMON_SERVICES } from "~common/services";

import { PermissionGuard, AuthGuard } from "./infrastructure/guards";
import { INFRASTRUCTURE_SERVICES } from "./infrastructure/services";
import { REPOSITORIES } from "./infrastructure/repositories";
import { HTTP_CONTROLLERS } from "./interface/controllers";
import { PROCESSORS } from "./infrastructure/processors";
import { GRPC_CONTROLLERS } from "./interface/grpc";
import { DOMAIN_SERVICES } from "./domain/services";
import { CONSUMERS } from "./interface/consumers";
import { COMMANDS } from "./application/commands";
import { QUEUES } from "./infrastructure/queues";
import { QUERIES } from "./application/queries";

@Module({
    imports: [
        TransactionManagerModule,
        BullModule.registerQueue({ name: "permission-cache-invalidation" }, { name: "dlq-retry" }),
    ],
    providers: [
        ...INFRASTRUCTURE_SERVICES,
        ...DOMAIN_SERVICES,
        ...COMMON_SERVICES,
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
    controllers: [...HTTP_CONTROLLERS, ...GRPC_CONTROLLERS, ...CONSUMERS],
})
export class AccessControlModule {}
