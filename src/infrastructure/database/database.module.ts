import { ConfigModule, ConfigService } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Global, Module } from "@nestjs/common";

import { ChangeLogSubscriber, TransactionManagerModule } from "~common/transaction-manager";

import { CredentialsWatcher } from "./utils/credentials-watcher";
import { PostgreSQLPoolRegistry } from "./pool.registry";
import { MikroOrmConfig } from "./database.config";

@Global()
@Module({
    imports: [
        ConfigModule,
        MikroOrmModule.forRootAsync({
            contextName: "write",
            imports: [TransactionManagerModule, ConfigModule],
            inject: [ChangeLogSubscriber, MikroOrmConfig, ConfigService],
            useFactory: (changeLogSubscriber: ChangeLogSubscriber, orm: MikroOrmConfig, config: ConfigService) => ({
                ...orm.buildOptions({ kind: "write", config }),
                subscribers: [changeLogSubscriber],
                registerRequestContext: false,
                autoLoadEntities: true,
            }),
        }),

        MikroOrmModule.forRootAsync({
            contextName: "read",
            imports: [ConfigModule],
            inject: [MikroOrmConfig, ConfigService],
            useFactory: (orm: MikroOrmConfig, config: ConfigService) => ({
                ...orm.buildOptions({ kind: "read", config }),
                registerRequestContext: false,
                autoLoadEntities: true,
            }),
        }),
    ],
    providers: [PostgreSQLPoolRegistry, MikroOrmConfig, CredentialsWatcher],
    exports: [PostgreSQLPoolRegistry, MikroOrmConfig],
})
export class DatabaseModule {}
