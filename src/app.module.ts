import { AcceptLanguageResolver, HeaderResolver, I18nJsonLoader, I18nModule, QueryResolver } from "nestjs-i18n";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { APP_FILTER } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { join } from "path";

import { DatabaseModule, RedisModule } from "~infrastructure";
import { GlobalExceptionFilter } from "~common/exceptions";
import { MetricsModule } from "~common/metrics";
import { HealthModule } from "~common/health";

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true, cache: true }),
        LoggerModule.forRoot({ pinoHttp: { autoLogging: false } }),
        MetricsModule,
        DatabaseModule,
        RedisModule,
        HealthModule,
        ClientsModule.registerAsync([
            {
                name: "KAFKA_SERVICE",
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.KAFKA,
                    options: {
                        client: {
                            clientId: configService.getOrThrow<string>("SERVICE_NAME"),
                            brokers: [configService.getOrThrow<string>("KAFKA_BROKER")],
                        },
                        consumer: {
                            groupId: `${configService.getOrThrow<string>("SERVICE_NAME")}-producer-client`,
                        },
                    },
                }),
            },
        ]),
        I18nModule.forRoot({
            fallbackLanguage: "en",
            loader: I18nJsonLoader,
            loaderOptions: { path: join(__dirname, "/i18n/"), watch: true },
            resolvers: [
                { use: QueryResolver, options: ["lang", "locale"] },
                new HeaderResolver(["x-locale"]),
                AcceptLanguageResolver,
            ],
        }),
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule {}
