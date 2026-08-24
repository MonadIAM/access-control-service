import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { Module, Global } from "@nestjs/common";

import { RateLimiterModule, BullMQModule, I18nModule } from "./modules";
import { COMMON_SERVICES } from "./services";
import { validateEnv } from "./validator";

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({ validate: validateEnv, envFilePath: ".env", isGlobal: true, cache: true }),
        RateLimiterModule,
        BullMQModule,
        I18nModule,
        ScheduleModule.forRoot(),
    ],
    exports: [...COMMON_SERVICES, ConfigModule, I18nModule],
    providers: [...COMMON_SERVICES],
})
export class SystemModule {}
