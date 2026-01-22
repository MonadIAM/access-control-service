import { ConfigModule, ConfigService } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Global, Module } from "@nestjs/common";

import { MikroOrmConfig } from "./database.config";

@Global()
@Module({
    imports: [
        ConfigModule,
        MikroOrmModule.forRootAsync({
            contextName: "global",
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                ...MikroOrmConfig.buildOptions(config),
                registerRequestContext: false,
                autoLoadEntities: true,
            }),
        }),
    ],
})
export class DatabaseModule {}
