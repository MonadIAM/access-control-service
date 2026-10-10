import { describe, expect, it } from "@jest/globals";
import {
    ForeignKeyConstraintViolationException,
    NotNullConstraintViolationException,
    UniqueConstraintViolationException,
    LockWaitTimeoutException,
    OptimisticLockError,
    ConnectionException,
    DeadlockException,
    DriverException,
    NotFoundError,
} from "@mikro-orm/core";

import { ExceptionMapper } from "./exception.mapper";
import { ErrorCode, ErrorKind } from "./enums";
import { Exception } from "./exception";

const cases = [
    {
        error: new NotFoundError("missing"),
        status: 404,
        kind: ErrorKind.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        key: "NOT_FOUND",
    },
    {
        error: new OptimisticLockError("changed"),
        status: 409,
        kind: ErrorKind.CONFLICT,
        code: ErrorCode.CONFLICT,
        key: "CONCURRENT_MODIFICATION",
    },
    {
        error: new DeadlockException(new Error("deadlock")),
        status: 409,
        kind: ErrorKind.DEADLOCK,
        code: ErrorCode.DEADLOCK,
        key: "DEADLOCK",
    },
    {
        error: new ConnectionException(new Error("disconnected")),
        status: 503,
        kind: ErrorKind.CONNECTION_ERROR,
        code: ErrorCode.CONNECTION_ERROR,
        key: "CONNECTION_LOST",
    },
    {
        error: new NotNullConstraintViolationException(new Error("null")),
        status: 400,
        kind: ErrorKind.NOT_NULL_VIOLATION,
        code: ErrorCode.NOT_NULL_VIOLATION,
        key: "NOT_NULL_VIOLATION",
    },
    {
        error: new UniqueConstraintViolationException(new Error("duplicate")),
        status: 409,
        kind: ErrorKind.UNIQUE_VIOLATION,
        code: ErrorCode.UNIQUE_VIOLATION,
        key: "UNIQUE_VIOLATION",
    },
    {
        error: new ForeignKeyConstraintViolationException(new Error("foreign key")),
        status: 409,
        kind: ErrorKind.FOREIGN_KEY_VIOLATION,
        code: ErrorCode.FOREIGN_KEY_VIOLATION,
        key: "FK_VIOLATION",
    },
    {
        error: new LockWaitTimeoutException(new Error("timeout")),
        status: 408,
        kind: ErrorKind.TIMEOUT,
        code: ErrorCode.TIMEOUT,
        key: "LOCK_TIMEOUT",
    },
];

describe("[DataMapper] - Exception", () => {
    describe("[Behavior] - ORM errors", () => {
        it.each(cases)("[case] - maps $key and preserves diagnostic context", ({ error, status, kind, code, key }) => {
            // Arrange

            // Act
            const mapped = ExceptionMapper.fromORM(error, "role");
            const result = ExceptionMapper.isORM(mapped);
            const result2 = ExceptionMapper.fromORM(mapped);
            const result3 = ExceptionMapper.isORM(error);

            // Assert
            expect(mapped).toMatchObject({
                statusCode: status,
                kind,
                code,
                messageKey: `db.${key}`,
                params: { resource: "role", timestamp: expect.any(String) },
            });
            expect(mapped.cause).toBe(error);
            expect(result).toBe(true);
            expect(result2).toBe(mapped);
            expect(result3).toBe(false);
        });

        it("[case] - keeps the driver code on a generic driver failure", () => {
            // Arrange
            const error = new DriverException(Object.assign(new Error("driver failure"), { code: "XX000" }));

            // Act
            const mapped = ExceptionMapper.fromORM(error);
            const result = ExceptionMapper.isORM(mapped);

            // Assert
            expect(mapped).toMatchObject({
                statusCode: 500,
                kind: ErrorKind.INTERNAL,
                code: ErrorCode.INTERNAL,
                messageKey: "db.INTERNAL_DRIVER_ERROR",
                params: { code: "XX000" },
            });
            expect(mapped.cause).toBe(error);
            expect(result).toBe(true);
        });

        it("[case] - passes external dependency failures through without marking them as ORM failures", () => {
            // Arrange
            const error = Exception.externalServiceFailed({ messageKey: "vault.failed" });

            // Act
            const result = ExceptionMapper.fromORM(error, "role");
            const result2 = ExceptionMapper.isORM(error);

            // Assert
            expect(result).toBe(error);
            expect(result2).toBe(false);
        });

        it.each([
            { label: "Error", value: new Error("unexpected") },
            { label: "null", value: null },
            { label: "undefined", value: undefined },
            { label: "string", value: "failure" },
            { label: "plain object", value: { message: "not an Error" } },
        ])("[case] - wraps unknown errors without classifying them as ORM ($label)", ({ value: error }) => {
            // Arrange

            // Act
            const mapped = ExceptionMapper.fromORM(error, "role");
            const result = ExceptionMapper.isORM(mapped);
            const result2 = ExceptionMapper.isORM(error);

            // Assert
            expect(mapped).toMatchObject({
                statusCode: 500,
                kind: ErrorKind.INTERNAL,
                code: ErrorCode.INTERNAL,
                messageKey: "db.INTERNAL_DRIVER_ERROR",
                params: { resource: "role" },
            });
            expect(mapped.cause).toBe(error);
            expect(result).toBe(false);
            expect(result2).toBe(false);
        });

        it("[case] - does not infer ORM origin from matching public properties", () => {
            // Arrange

            // Act
            const mapped = ExceptionMapper.fromORM(new DeadlockException(new Error("deadlock")));
            const result = ExceptionMapper.isORM(new Exception(mapped));

            // Assert
            expect(result).toBe(false);
        });
    });
});
