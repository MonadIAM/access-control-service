import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";

import { RateLimiterModule, BullMQModule } from "./modules";
import { validateEnv } from "./validator";
import { I18nModule } from "./i18n";

@Module({
    imports: [
        ConfigModule.forRoot({ validate: validateEnv, envFilePath: ".env", isGlobal: true, cache: true }),
        RateLimiterModule,
        BullMQModule,
        I18nModule,
        ScheduleModule.forRoot(),
    ],
    exports: [ConfigModule, RateLimiterModule, I18nModule],
})
export class SystemModule {}
