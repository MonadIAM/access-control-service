import "reflect-metadata";

import { DocumentBuilder, SwaggerModule as NestSwaggerModule } from "@nestjs/swagger";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { NestFactory } from "@nestjs/core";
import { writeFileSync } from "node:fs";
import dotenv from "dotenv";

import { name, version } from "../../package.json";
import { SwaggerModule } from "./swagger.module";

dotenv.config();

void (async function (): Promise<void> {
    const application = await NestFactory.create<NestFastifyApplication>(
        SwaggerModule,
        new FastifyAdapter({
            bodyLimit: Number(process.env.BODY_LIMIT_BYTES),
            trustProxy: true,
            logger: false,
        }),
        { logger: false },
    );

    application.setGlobalPrefix(`api/v${process.env.API_VERSION}`);

    const config = new DocumentBuilder()
        .addServer(`http://localhost:${process.env.APP_PORT}`)
        .setVersion(version)
        .setTitle(name)
        .build();
    const document = NestSwaggerModule.createDocument(application, config);

    writeFileSync("access-control.swagger.json", `${JSON.stringify(document, null, 2)}\n`);

    await application.close();
})();
