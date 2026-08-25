import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TransportTargetOptions } from "pino";
import { Module } from "@nestjs/common";

import { NodeEnv } from "~common/enums";

const LOG_LEVEL = "warn";

@Module({
    imports: [
        PinoLoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const nodeEnv = configService.getOrThrow<NodeEnv>("NODE_ENV");
                const isDev = nodeEnv === NodeEnv.DEVELOPMENT;
                const targets: TransportTargetOptions[] = [];

                if (isDev) {
                    targets.push({
                        target: require.resolve("pino-pretty"),
                        level: LOG_LEVEL,
                        options: {
                            translateTime: "UTC:yyyy-mm-dd HH:MM:ss",
                            singleLine: true,
                            colorize: true,
                        },
                    });
                }

                if (configService.getOrThrow<boolean>("LOKI_ENABLED")) {
                    targets.push({
                        target: require.resolve("pino-loki"),
                        level: LOG_LEVEL,
                        options: {
                            interval: configService.getOrThrow<number>("LOKI_BATCH_INTERVAL"),
                            host: configService.getOrThrow<string>("LOKI_URL"),
                            replaceTimestamp: false,
                            silenceErrors: false,
                            batching: true,
                            labels: {
                                job: configService.getOrThrow<string>("SERVICE_NAME"),
                                env: nodeEnv,
                            },
                        },
                    });
                }

                return {
                    pinoHttp: {
                        redact: ["req.headers.authorization", "req.headers.cookie", "body.password"],
                        transport: targets.length > 0 ? { targets } : undefined,
                        quietReqLogger: true,
                        autoLogging: false,
                        level: LOG_LEVEL,
                    },
                };
            },
        }),
    ],
    exports: [PinoLoggerModule],
})
export class LoggerModule {}
