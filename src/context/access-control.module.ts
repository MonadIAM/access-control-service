import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { TransactionManagerModule } from "~common/transaction-manager";
import { FormatResponseInterceptor } from "~common/interceptors";
import { COMMON_SERVICES } from "~common/services";

import { ReauthenticationGuard, PermissionGuard, AuthnGuard } from "./infrastructure/guards";
import { INFRASTRUCTURE_SERVICES } from "./infrastructure/services";
import { REPOSITORIES } from "./infrastructure/repositories";
import { BullQueue, QUEUES } from "./infrastructure/queues";
import { HTTP_CONTROLLERS } from "./interface/controllers";
import { GRPC_CONTROLLERS } from "./interface/grpc";
import { DOMAIN_SERVICES } from "./domain/services";
import { CONSUMERS } from "./interface/consumers";
import { COMMANDS } from "./application/commands";
import { QUERIES } from "./application/queries";

@Module({
    imports: [TransactionManagerModule, BullModule.registerQueue({ name: BullQueue.KAFKA_RETRY })],
    providers: [
        ...INFRASTRUCTURE_SERVICES,
        ...DOMAIN_SERVICES,
        ...COMMON_SERVICES,
        ...REPOSITORIES,
        ...QUEUES,
        ...COMMANDS,
        ...QUERIES,
        ReauthenticationGuard,
        PermissionGuard,
        AuthnGuard,
        {
            provide: APP_INTERCEPTOR,
            useClass: FormatResponseInterceptor,
        },
        {
            provide: APP_GUARD,
            useExisting: AuthnGuard,
        },
        {
            provide: APP_GUARD,
            useExisting: PermissionGuard,
        },
        {
            provide: APP_GUARD,
            useExisting: ReauthenticationGuard,
        },
    ],
    controllers: [...HTTP_CONTROLLERS, ...GRPC_CONTROLLERS, ...CONSUMERS],
})
export class AccessControlModule {}
