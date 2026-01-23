import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { APP_FILTER } from "@nestjs/core";
import { Module } from "@nestjs/common";

import { DatabaseModule, RedisModule } from "~infrastructure";
import { GlobalExceptionFilter } from "~common/exceptions";
import { MetricsModule } from "~infrastructure/metrics";
import { HealthModule } from "~infrastructure/health";
import { KafkaModule } from "~infrastructure/kafka";
import { I18nModule } from "~infrastructure/i18n";

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true, cache: true }),
        LoggerModule.forRoot({ pinoHttp: { autoLogging: false } }),
        MetricsModule,
        DatabaseModule,
        RedisModule,
        HealthModule,
        KafkaModule,
        I18nModule,
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule {}
