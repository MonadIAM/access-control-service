import { ClientsModule, Transport } from "@nestjs/microservices";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { Module } from "@nestjs/common";

import { DatabaseModule, RedisModule } from "~infrastructure";

import { HealthModule } from "./health/health.module";
import { MetricsModule } from "./bootstrap/metrics.module";

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true, cache: true }),
        LoggerModule.forRoot({ pinoHttp: { autoLogging: false } }),
        MetricsModule,
        DatabaseModule,
        RedisModule,
        HealthModule,
        PrometheusModule.register({ path: "/metrics" }),
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
    ],
})
export class AppModule {}
