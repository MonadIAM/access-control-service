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

describe("[Exception] - Exception", () => {
    describe("[Behavior] - factory methods", () => {
        it.each(factories)(
            "[case] - provides the status, kind and default code ($name)",
            ({ create, status, kind, code }) => {
                // Arrange

                // Act
                const error = create({ messageKey: "test.message" });

                // Assert
                expect(error).toMatchObject({
                    messageKey: "test.message",
                    message: "test.message",
                    statusCode: status,
                    kind,
                    code,
                });
            },
        );

        it.each(factories)("[case] - preserves custom code and context ($name)", ({ create, status, kind }) => {
            // Arrange
            const props = {
                code: ErrorCode.CORS_ORIGIN_FORBIDDEN,
                headers: { "X-Reason": "test" },
                params: { resource: "role" },
                messageKey: "test.message",
            };

            // Act
            const error = create(props);

            // Assert
            expect(error).toMatchObject({ ...props, statusCode: status, kind });
        });
    });

    describe("[Method] - constructor", () => {
        it("[case] - preserves error identity, cause, details and an ISO timestamp", () => {
            // Arrange
            class CustomException extends Exception {}
            const cause = new Error("original failure");
            const details = [{ path: "name", message: "invalid", constraint: "isString" }];

            // Act
            const error = new CustomException({
                kind: ErrorKind.BAD_REQUEST,
                code: ErrorCode.BAD_REQUEST,
                messageKey: "invalid",
                statusCode: 400,
                details,
                cause,
            });

            // Assert
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(Exception);
            expect(error.name).toBe("CustomException");
            expect(error.cause).toBe(cause);
            expect(error.details).toEqual(details);
            expect(new Date(error.timestamp).toISOString()).toBe(error.timestamp);
        });
    });

    describe("[Method] - validationFailed", () => {
        it("[case] - builds a validation response without losing individual field details", () => {
            // Arrange
            const details = [
                { path: "items.0.name", constraint: "isString", message: "validator.IS_STRING", invalidValue: 123 },
            ];

            // Act
            const error = Exception.validationFailed(details);

            // Assert
            expect(error).toMatchObject({
                statusCode: 422,
                kind: ErrorKind.UNPROCESSABLE,
                code: ErrorCode.UNPROCESSABLE,
                messageKey: "validator.COMMON_ERROR",
                details,
            });
        });
    });

    describe("[Method] - isRetryable", () => {
        it.each([500, 502, 503, 504, 408])("[case] - retries application status %s", (statusCode) => {
            // Arrange
            const error = new Exception({
                statusCode,
                kind: ErrorKind.INTERNAL,
                code: ErrorCode.INTERNAL,
                messageKey: "test",
            });

            // Act
            const result = Exception.isRetryable(error);

            // Assert
            expect(result).toBe(true);
        });
        it.each([400, 401, 403, 404, 405, 409, 422, 429])("[case] - does not retry application status %s", (statusCode) => {
            // Arrange
            const error = new Exception({
                statusCode,
                kind: ErrorKind.CONFLICT,
                code: ErrorCode.CONFLICT,
                messageKey: "test",
            });

            // Act
            const result = Exception.isRetryable(error);

            // Assert
            expect(result).toBe(false);
        });
        it("[case] - retries a deadlock even though its HTTP status is 409", () => {
            // Arrange
            const error = new Exception({
                statusCode: 409,
                kind: ErrorKind.DEADLOCK,
                code: ErrorCode.DEADLOCK,
                messageKey: "test",
            });

            // Act
            const result = Exception.isRetryable(error);

            // Assert
            expect(result).toBe(true);
        });
        it.each(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "EAI_AGAIN", "ENETUNREACH"])(
            "[case] - retries network error %s",
            (code) => {
                // Arrange
                const error = Object.assign(new Error("network failure"), { code });

                // Act
                const result = Exception.isRetryable(error);

                // Assert
                expect(result).toBe(true);
            },
        );
        it.each(["LOADING", "TRYAGAIN", "CLUSTERDOWN", "MASTERDOWN", "READONLY", "BUSY"])(
            "[case] - retries Redis %s replies",
            (prefix) => {
                // Arrange
                const error = Object.assign(new Error(`${prefix} temporary failure`), { name: "ReplyError" });

                // Act
                const result = Exception.isRetryable(error);

                // Assert
                expect(result).toBe(true);
            },
        );
        it.each([
            { label: "retry limit", value: Object.assign(new Error("retry limit"), { name: "MaxRetriesPerRequestError" }) },
            { label: "closed connection", value: new Error("Connection is closed.") },
            { label: "Redis loading", value: Object.assign(new Error("LOADING"), { name: "ReplyError" }) },
        ])("[case] - retries supported connection failures ($label)", ({ value: error }) => {
            // Arrange

            // Act
            const result = Exception.isRetryable(error);

            // Assert
            expect(result).toBe(true);
        });
        it.each([
            { label: "ordinary error", value: new Error("ordinary failure") },
            { label: "unknown network code", value: Object.assign(new Error("network"), { code: "ENOENT" }) },
            { label: "numeric network code", value: Object.assign(new Error("network"), { code: 500 }) },
            { label: "non-Redis loading error", value: new Error("LOADING temporary failure") },
            { label: "unknown Redis prefix", value: Object.assign(new Error("LOADING_OTHER"), { name: "ReplyError" }) },
            {
                label: "Redis command error",
                value: Object.assign(new Error("ERR invalid command"), { name: "ReplyError" }),
            },
            { label: "different closed message", value: new Error("Connection is closed. additional text") },
            { label: "null", value: null },
            { label: "undefined", value: undefined },
            { label: "string", value: "ECONNRESET" },
            { label: "plain object", value: { code: "ECONNRESET" } },
        ])("[case] - does not retry unsupported values ($label)", ({ value: error }) => {
            // Arrange

            // Act
            const result = Exception.isRetryable(error);

            // Assert
            expect(result).toBe(false);
        });
    });
});
