import { describe, expect, it } from "@jest/globals";

import { ErrorCode, ErrorKind } from "./enums";
import { Exception } from "./exception";

const factories = [
    /* eslint-disable prettier/prettier */
    { name: "badRequest", create: Exception.badRequest, status: 400, kind: ErrorKind.BAD_REQUEST, code: ErrorCode.BAD_REQUEST },
    { name: "unauthorized", create: Exception.unauthorized, status: 401, kind: ErrorKind.UNAUTHORIZED, code: ErrorCode.UNAUTHORIZED },
    { name: "forbidden", create: Exception.forbidden, status: 403, kind: ErrorKind.FORBIDDEN, code: ErrorCode.FORBIDDEN },
    { name: "methodNotAllowed", create: Exception.methodNotAllowed, status: 405, kind: ErrorKind.METHOD_NOT_ALLOWED, code: ErrorCode.METHOD_NOT_ALLOWED },
    { name: "notFound", create: Exception.notFound, status: 404, kind: ErrorKind.NOT_FOUND, code: ErrorCode.NOT_FOUND },
    { name: "conflict", create: Exception.conflict, status: 409, kind: ErrorKind.CONFLICT, code: ErrorCode.CONFLICT },
    { name: "internal", create: Exception.internal, status: 500, kind: ErrorKind.INTERNAL, code: ErrorCode.INTERNAL },
    { name: "unprocessable", create: Exception.unprocessable, status: 422, kind: ErrorKind.UNPROCESSABLE, code: ErrorCode.UNPROCESSABLE },
    { name: "invariantViolation", create: Exception.invariantViolation, status: 400, kind: ErrorKind.INVARIANT_VIOLATION, code: ErrorCode.INVARIANT_VIOLATION },
    { name: "externalServiceFailed", create: Exception.externalServiceFailed, status: 502, kind: ErrorKind.EXTERNAL_SERVICE_FAILED, code: ErrorCode.EXTERNAL_SERVICE_FAILED },
    { name: "externalAuthnFailed", create: Exception.externalAuthnFailed, status: 401, kind: ErrorKind.EXTERNAL_AUTHN_FAILED, code: ErrorCode.EXTERNAL_AUTHN_FAILED },
    /* eslint-enable prettier/prettier */
];

describe("Exception contracts", () => {
    describe("factory methods", () => {
        it.each(factories)("$name provides the status, kind and default code", ({ create, status, kind, code }) => {
            const error = create({ messageKey: "test.message" });

            expect(error).toMatchObject({
                messageKey: "test.message",
                message: "test.message",
                statusCode: status,
                kind,
                code,
            });
        });

        it.each(factories)("$name preserves an explicit code and response context", ({ create, status, kind }) => {
            const props = {
                code: ErrorCode.CORS_ORIGIN_FORBIDDEN,
                headers: { "X-Reason": "test" },
                params: { resource: "role" },
                messageKey: "test.message",
            };

            const error = create(props);

            expect(error).toMatchObject({ ...props, statusCode: status, kind });
        });
    });

    describe("constructor", () => {
        it("preserves error identity, cause, details and an ISO timestamp", () => {
            class CustomException extends Exception {}
            const cause = new Error("original failure");
            const details = [{ path: "name", message: "invalid", constraint: "isString" }];

            const error = new CustomException({
                kind: ErrorKind.BAD_REQUEST,
                code: ErrorCode.BAD_REQUEST,
                messageKey: "invalid",
                statusCode: 400,
                details,
                cause,
            });

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(Exception);
            expect(error.name).toBe("CustomException");
            expect(error.cause).toBe(cause);
            expect(error.details).toEqual(details);
            expect(new Date(error.timestamp).toISOString()).toBe(error.timestamp);
        });
    });

    describe("validationFailed", () => {
        it("builds a validation response without losing individual field details", () => {
            const details = [
                { path: "items.0.name", constraint: "isString", message: "validator.IS_STRING", invalidValue: 123 },
            ];

            const error = Exception.validationFailed(details);

            expect(error).toMatchObject({
                statusCode: 422,
                kind: ErrorKind.UNPROCESSABLE,
                code: ErrorCode.UNPROCESSABLE,
                messageKey: "validator.COMMON_ERROR",
                details,
            });
        });
    });
});

describe("Exception.isRetryable", () => {
    it.each([500, 502, 503, 504, 408])("retries application status %s", (statusCode) => {
        const error = new Exception({
            statusCode,
            kind: ErrorKind.INTERNAL,
            code: ErrorCode.INTERNAL,
            messageKey: "test",
        });

        const result = Exception.isRetryable(error);

        expect(result).toBe(true);
    });
    it.each([400, 401, 403, 404, 405, 409, 422, 429])("does not retry application status %s", (statusCode) => {
        const error = new Exception({
            statusCode,
            kind: ErrorKind.CONFLICT,
            code: ErrorCode.CONFLICT,
            messageKey: "test",
        });

        const result = Exception.isRetryable(error);

        expect(result).toBe(false);
    });
    it("retries a deadlock even though its HTTP status is 409", () => {
        const error = new Exception({
            statusCode: 409,
            kind: ErrorKind.DEADLOCK,
            code: ErrorCode.DEADLOCK,
            messageKey: "test",
        });

        const result = Exception.isRetryable(error);

        expect(result).toBe(true);
    });
    it.each(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "EAI_AGAIN", "ENETUNREACH"])(
        "retries network error %s",
        (code) => {
            const error = Object.assign(new Error("network failure"), { code });

            const result = Exception.isRetryable(error);

            expect(result).toBe(true);
        },
    );
    it.each(["LOADING", "TRYAGAIN", "CLUSTERDOWN", "MASTERDOWN", "READONLY", "BUSY"])(
        "retries Redis %s replies",
        (prefix) => {
            const error = Object.assign(new Error(`${prefix} temporary failure`), { name: "ReplyError" });

            const result = Exception.isRetryable(error);

            expect(result).toBe(true);
        },
    );
    it.each([
        Object.assign(new Error("retry limit"), { name: "MaxRetriesPerRequestError" }),
        new Error("Connection is closed."),
        Object.assign(new Error("LOADING"), { name: "ReplyError" }),
    ])("retries supported connection failures: %s", (error) => {
        const result = Exception.isRetryable(error);

        expect(result).toBe(true);
    });
    it.each([
        new Error("ordinary failure"),
        Object.assign(new Error("network"), { code: "ENOENT" }),
        Object.assign(new Error("network"), { code: 500 }),
        new Error("LOADING temporary failure"),
        Object.assign(new Error("LOADING_OTHER"), { name: "ReplyError" }),
        Object.assign(new Error("ERR invalid command"), { name: "ReplyError" }),
        new Error("Connection is closed. additional text"),
        null,
        undefined,
        "ECONNRESET",
        { code: "ECONNRESET" },
    ])("does not retry unsupported values: %s", (error) => {
        const result = Exception.isRetryable(error);

        expect(result).toBe(false);
    });
});
