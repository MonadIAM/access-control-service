import { SwaggerModule, DocumentBuilder, OpenAPIObject, ApiOkResponse } from "@nestjs/swagger";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { Controller, Get, HttpStatus, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { EXCEPTION_EXAMPLES } from "~common/exceptions/exception.examples";

import { Swagger } from "./swagger.decorators";

@Controller("documented")
@Swagger.Exceptions(HttpStatus.UNAUTHORIZED)
class DocumentedController {
    @Get("specific")
    @ApiOkResponse()
    @Swagger.Exceptions(HttpStatus.FORBIDDEN, HttpStatus.CONFLICT)
    public specific(): void {}

    @Get("inherited")
    public inherited(): void {}

    @Get("empty")
    @Swagger.Exceptions()
    public empty(): void {}
}

@Controller("plain")
class PlainController {
    @Get()
    public handle(): void {}
}

@Module({ controllers: [DocumentedController, PlainController] })
class SwaggerTestModule {}

describe("[Decorator] - Swagger", () => {
    let app: NestFastifyApplication;
    let document: OpenAPIObject;

    beforeAll(async () => {
        app = await NestFactory.create<NestFastifyApplication>(SwaggerTestModule, new FastifyAdapter(), { logger: false });
        await app.init();
        document = SwaggerModule.createDocument(
            app,
            new DocumentBuilder().setTitle("Decorator contract").setVersion("1").build(),
        );
    });

    afterAll(async () => {
        await app?.close();
    });

    describe("[Function] - Exceptions", () => {
        it.each([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.CONFLICT] as const)(
            "[case] - documents status %s with a resolvable error schema and its example",
            (status) => {
                // Arrange

                // Act
                const response = document.paths["/documented/specific"].get!.responses[status];

                // Assert
                expect(response).toMatchObject({
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ErrorResponseBody" },
                            example: EXCEPTION_EXAMPLES[status],
                        },
                    },
                });
                expect(document.components?.schemas?.ErrorResponseBody).toMatchObject({
                    properties: { statusCode: expect.any(Object), message: expect.any(Object), error: expect.any(Object) },
                });
            },
        );

        it("[case] - does not leak handler responses to sibling routes or another controller", () => {
            // Arrange

            // Act
            const specific = Object.keys(document.paths["/documented/specific"].get!.responses).sort();
            const inherited = Object.keys(document.paths["/documented/inherited"].get!.responses).sort();
            const plain = Object.keys(document.paths["/plain"].get!.responses);

            // Assert
            expect(specific).toEqual(["200", "401", "403", "409"]);
            expect(inherited).toEqual(["200", "401"]);
            expect(plain).toEqual(["200"]);
        });

        it("[case] - accepts an empty status list without introducing extra error responses", () => {
            // Arrange

            // Act
            const responses = Object.keys(document.paths["/documented/empty"].get!.responses).sort();

            // Assert
            expect(responses).toEqual(["200", "401"]);
        });
    });
});
