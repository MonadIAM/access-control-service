import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";

import { RateLimiterModule } from "./rate-limiter";
import { validateEnv } from "./validator";
import { BullMQModule } from "./bullmq";
import { I18nModule } from "./i18n";

@Module({
    imports: [
        ConfigModule.forRoot({ validate: validateEnv, envFilePath: ".env", isGlobal: true, cache: true }),
        RateLimiterModule,
        BullMQModule,
        I18nModule,
    ],
    exports: [ConfigModule, RateLimiterModule, I18nModule],
})
export class SystemModule {}
