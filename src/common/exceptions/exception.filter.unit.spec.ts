import { Controller, Get, HttpException, Logger, Module, Param } from "@nestjs/common";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { I18nService, TranslateOptions } from "nestjs-i18n";
import { ThrottlerException } from "@nestjs/throttler";
import { NestFactory } from "@nestjs/core";

import { ExceptionFilter } from "./exception.filter";
import { ErrorCode, ErrorKind } from "./enums";
import { Exception } from "./exception";

const details: Exception.ValidationDetail[] = [
    {
        message: "validator.IS_STRING",
        args: { label: "Name" },
        constraint: "isString",
        path: "items.0.name",
        invalidValue: 123,
    },
    { path: "age", constraint: "min", message: "validator.MIN" },
];

const failures: Record<string, unknown> = {
    external: Exception.externalServiceFailed({ messageKey: "vault.UNAVAILABLE" }),
    httpServer: new HttpException("SECRET: upstream failure", 503),
    httpClient: new HttpException("request.INVALID", 400),
    unknown: new Error("SECRET: implementation detail"),
    validation: Exception.validationFailed(details),
    emptyValidation: Exception.validationFailed([]),
    primitive: "SECRET: thrown string",
    throttle: new ThrottlerException(),
    internal: new Exception({
        messageKey: "SECRET: database password",
        cause: new Error("private cause"),
        params: { secret: "private" },
        kind: ErrorKind.INTERNAL,
        code: ErrorCode.INTERNAL,
        statusCode: 500,
    }),
    unauthorized: Exception.unauthorized({
        headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
        params: { resource: "session" },
        messageKey: "auth.INVALID",
    }),
};

@Controller("errors")
class ErrorController {
    @Get(":scenario")
    public fail(@Param("scenario") scenario: string): never {
        throw failures[scenario];
    }
}

@Module({ controllers: [ErrorController] })
class ErrorTestModule {}

describe("ExceptionFilter HTTP contract", () => {
    let app: NestFastifyApplication;
    const translate = jest.fn((key: string, options?: TranslateOptions): string => `${options?.lang}:${key}`);
    const log = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

    beforeAll(async () => {
        const adapter = new FastifyAdapter();
        adapter.getInstance().addHook("onRequest", (request, _reply, done) => {
            const lang = request.headers["x-test-language"];
            if (lang) {
                Object.assign(request, { i18nContext: { lang } });
            }
            done();
        });
        app = await NestFactory.create<NestFastifyApplication>(ErrorTestModule, adapter, { logger: false });
        app.useGlobalFilters(new ExceptionFilter({ translate } as unknown as I18nService));
        await app.init();
        await adapter.getInstance().ready();
    });

    afterAll(async () => {
        await app?.close();
        log.mockRestore();
    });

    describe("catch", () => {
        it("returns application fields and authentication headers with the default language", async () => {
            const response = await app.inject({ method: "GET", url: "/errors/unauthorized?trace=1" });

            expect(response.statusCode).toBe(401);
            expect(response.headers["www-authenticate"]).toBe('Bearer error="invalid_token"');
            expect(response.json()).toEqual({
                statusCode: 401,
                error: ErrorKind.UNAUTHORIZED,
                code: ErrorCode.UNAUTHORIZED,
                message: "en:auth.INVALID",
                path: "/errors/unauthorized?trace=1",
                timestamp: (failures.unauthorized as Exception).timestamp,
            });
            expect(translate).toHaveBeenCalledWith("auth.INVALID", {
                lang: "en",
                defaultValue: "auth.INVALID",
                args: { resource: "session" },
            });
            expect(log).not.toHaveBeenCalled();
        });

        it("translates validation details using request language and the last path segment", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/errors/validation",
                headers: { "x-test-language": "ru" },
            });

            expect(response.statusCode).toBe(422);
            expect(response.json()).toMatchObject({
                message: "ru:validator.COMMON_ERROR",
                details: [
                    { ...details[0], message: "ru:validator.IS_STRING" },
                    { ...details[1], message: "ru:validator.MIN" },
                ],
            });
            expect(translate).toHaveBeenCalledWith("validator.IS_STRING", {
                lang: "ru",
                defaultValue: "validator.IS_STRING",
                args: { label: "Name", property: "name" },
            });
            expect(translate).toHaveBeenCalledWith("validator.MIN", {
                lang: "ru",
                defaultValue: "validator.MIN",
                args: { property: "age" },
            });
            expect(details[0].message).toBe("validator.IS_STRING");
            expect(log).not.toHaveBeenCalled();
        });

        it("preserves an explicitly empty validation detail list", async () => {
            const response = await app.inject({ method: "GET", url: "/errors/emptyValidation" });

            expect(response.statusCode).toBe(422);
            expect(response.json().details).toEqual([]);
        });

        it.each([
            { scenario: "internal", status: 500 },
            { scenario: "unknown", status: 500 },
            { scenario: "primitive", status: 500 },
            { scenario: "httpServer", status: 503 },
        ])("hides internal information for $scenario and logs the original error", async ({ scenario, status }) => {
            const response = await app.inject({ method: "GET", url: `/errors/${scenario}` });
            const body = response.json();

            expect(response.statusCode).toBe(status);
            expect(body).toEqual({
                statusCode: status,
                error: ErrorKind.INTERNAL,
                code: ErrorCode.INTERNAL,
                message: "Internal Server Error",
                path: `/errors/${scenario}`,
                timestamp: expect.any(String),
            });
            expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
            expect(response.body).not.toContain("SECRET");
            expect(translate).not.toHaveBeenCalled();
            expect(log).toHaveBeenCalledTimes(1);
            expect(log).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: status,
                    method: "GET",
                    path: `/errors/${scenario}`,
                    code: ErrorCode.INTERNAL,
                    err: failures[scenario],
                }),
                "Internal Error",
            );
        });

        it("translates a client HttpException without logging an internal error", async () => {
            const response = await app.inject({ method: "GET", url: "/errors/httpClient" });

            expect(response.statusCode).toBe(400);
            expect(response.json()).toMatchObject({
                statusCode: 400,
                message: "en:request.INVALID",
                error: "HttpException",
                code: "HttpException",
            });
            expect(log).not.toHaveBeenCalled();
        });

        it("preserves throttling status and translates its message", async () => {
            const error = failures.throttle as ThrottlerException;

            const response = await app.inject({ method: "GET", url: "/errors/throttle" });

            expect(response.statusCode).toBe(429);
            expect(response.json()).toMatchObject({
                statusCode: 429,
                message: `en:${error.message}`,
                error: error.name,
                code: error.name,
            });
            expect(translate).toHaveBeenCalledWith(error.message, { lang: "en", defaultValue: error.message });
            expect(log).not.toHaveBeenCalled();
        });

        it("exposes the public dependency error and records its kind in the error log", async () => {
            const response = await app.inject({ method: "GET", url: "/errors/external" });

            expect(response.statusCode).toBe(502);
            expect(response.json()).toMatchObject({
                message: "en:vault.UNAVAILABLE",
                error: ErrorKind.EXTERNAL_SERVICE_FAILED,
                code: ErrorCode.EXTERNAL_SERVICE_FAILED,
            });
            expect(log).toHaveBeenCalledWith(
                expect.objectContaining({ kind: ErrorKind.EXTERNAL_SERVICE_FAILED, err: failures.external }),
                "Internal Error",
            );
        });
    });
});
