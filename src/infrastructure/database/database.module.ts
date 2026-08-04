import { ConfigModule, ConfigService } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Global, Module } from "@nestjs/common";

import { ChangeLogSubscriber, TransactionManagerModule } from "~common/transaction-manager";

import { MikroOrmConfig } from "./database.config";

@Global()
@Module({
    imports: [
        ConfigModule,
        MikroOrmModule.forRootAsync({
            contextName: "write",
            imports: [TransactionManagerModule, ConfigModule],
            inject: [ChangeLogSubscriber, ConfigService],
            useFactory: (changeLogSubscriber: ChangeLogSubscriber, config: ConfigService) => ({
                ...MikroOrmConfig.buildOptions({ kind: "write", config }),
                subscribers: [changeLogSubscriber],
                registerRequestContext: false,
                autoLoadEntities: true,
            }),
        }),

        MikroOrmModule.forRootAsync({
            contextName: "read",
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const cqrsEnabled = config.getOrThrow<string>("POSTGRES_CQRS_ENABLED") === "true";
                if (cqrsEnabled) {
                    return {
                        ...MikroOrmConfig.buildOptions({ kind: "read", config }),
                        registerRequestContext: false,
                        autoLoadEntities: true,
                    };
                } else {
                    return {
                        ...MikroOrmConfig.buildOptions({ kind: "write", config }),
                        registerRequestContext: false,
                        autoLoadEntities: true,
                    };
                }
            },
        }),
    ],
})
export class DatabaseModule {}
