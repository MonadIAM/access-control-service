import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Module } from "@nestjs/common";

@Module({
    imports: [
        PinoLoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const isDev = configService.getOrThrow("NODE_ENV") === "development";

                return {
                    pinoHttp: {
                        level: isDev ? "debug" : "info",
                        transport: isDev
                            ? {
                                  target: require.resolve("pino-pretty"),
                                  options: {
                                      singleLine: true,
                                      colorize: true,
                                      translateTime: "UTC:yyyy-mm-dd HH:MM:ss",
                                  },
                              }
                            : undefined,
                        redact: ["req.headers.authorization", "req.headers.cookie", "body.password"],
                        quietReqLogger: true,
                        autoLogging: false,
                    },
                };
            },
        }),
    ],
    exports: [PinoLoggerModule],
})
export class LoggerModule {}
