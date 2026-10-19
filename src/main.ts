import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { MicroserviceOptions } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import cookie from "@fastify/cookie";

import { BootstrapReference, BootstrapSecurity, BootstrapPipes, BootstrapMetrics } from "~bootstrap";
import { KAFKA_CONFIG } from "~infrastructure/kafka";
import { GRPC_CONFIG } from "~infrastructure/grpc";

import { MainModule } from "./main.module";
import "./extensions";

void (async function (): Promise<void> {
    const fastifyAdapter = new FastifyAdapter({
        bodyLimit: Number(process.env.BODY_LIMIT_BYTES),
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
    BootstrapMetrics.registerMetricsHooks(application);
    await BootstrapSecurity.registerSecurityPlugins(application);
    await BootstrapReference.registerReference(application);

    const kafkaConfig = application.get<MicroserviceOptions>(KAFKA_CONFIG);
    const grpcConfig = application.get<MicroserviceOptions>(GRPC_CONFIG);

    application.connectMicroservice(kafkaConfig);
    application.connectMicroservice(grpcConfig);

    application.enableShutdownHooks();

    const port: number = configService.getOrThrow<number>("APP_PORT");
    const host: string = configService.getOrThrow<string>("APP_HOST");

    await application.init();
    await application.startAllMicroservices();
    await application.listen({ port, host });
})();
