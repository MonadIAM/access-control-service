import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";

import { RateLimiterModule, BullMQModule, I18nModule } from "./modules";
import { validateEnv } from "./validator";

@Module({
    imports: [
        ConfigModule.forRoot({ validate: validateEnv, envFilePath: ".env", isGlobal: true, cache: true }),
        RateLimiterModule,
        BullMQModule,
        I18nModule,
        ScheduleModule.forRoot(),
    ],
    exports: [ConfigModule, I18nModule],
})
export class SystemModule {}
