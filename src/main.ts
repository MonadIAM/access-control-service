import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
    const fastifyAdapter = new FastifyAdapter({
        bodyLimit: 5 * 1024 * 1024,
        trustProxy: true,
        logger: false,
    });

    const application = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, { bufferLogs: true });
    application.useLogger(application.get(Logger));
    application.setGlobalPrefix("api");

    const configService = application.get(ConfigService);

    application.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: {
                brokers: [configService.getOrThrow<string>("KAFKA_BROKER")],
                retry: {
                    initialRetryTime: configService.getOrThrow<number>("KAFKA_RETRY_INITIAL_TIME"),
                    retries: configService.getOrThrow<number>("KAFKA_RETRY_ATTEMPTS"),
                },
            },
            consumer: {
                groupId: `${configService.getOrThrow<string>("SERVICE_NAME")}-consumer-server`,
                allowAutoTopicCreation: true,
            },
        },
    });

    application.enableShutdownHooks();

    const port: number = configService.getOrThrow<number>("APP_PORT");
    const host: string = configService.getOrThrow<string>("APP_HOST");

    await application.startAllMicroservices();
    await application.listen({ port, host });
}
bootstrap();
