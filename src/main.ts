import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { MicroserviceOptions } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import cookie from "@fastify/cookie";

import { KAFKA_MICROSERVICE_CONFIG } from "~infrastructure/kafka";
import { BootstrapSecurity } from "~bootstrap/security.bootstrap";
import { BootstrapSwagger } from "~bootstrap/swagger.bootstrap";
import { BootstrapPipes } from "~bootstrap/pipes.bootstrap";

import { MainModule } from "./main.module";
import "./extensions";

async function bootstrap(): Promise<void> {
    const fastifyAdapter = new FastifyAdapter({
        bodyLimit: 5 * 1024 * 1024,
        trustProxy: true,
        logger: false,
    });

    const application = await NestFactory.create<NestFastifyApplication>(MainModule, fastifyAdapter, { bufferLogs: true });

    await application.register(cookie);

    application.useLogger(application.get(Logger));
    const configService = application.get(ConfigService);

    const version: number = configService.getOrThrow<number>("API_VERSION");

    application.setGlobalPrefix(`api/v${version}`);

    BootstrapPipes.applyGlobalPipes(application);
    BootstrapSwagger.registerSwagger(application);
    await BootstrapSecurity.registerSecurityPlugins(application);

    const kafkaConfig = application.get<MicroserviceOptions>(KAFKA_MICROSERVICE_CONFIG);

    application.connectMicroservice(kafkaConfig);

    application.enableShutdownHooks();

    const port: number = configService.getOrThrow<number>("APP_PORT");
    const host: string = configService.getOrThrow<string>("APP_HOST");

    await application.startAllMicroservices();
    await application.listen({ port, host });
}
bootstrap();
