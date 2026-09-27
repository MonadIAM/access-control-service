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

describe("ExceptionMapper", () => {
    describe("fromORM / isORM", () => {
        it.each(cases)("maps $key and preserves diagnostic context", ({ error, status, kind, code, key }) => {
            const mapped = ExceptionMapper.fromORM(error, "role");

            expect(mapped).toMatchObject({
                statusCode: status,
                kind,
                code,
                messageKey: `db.${key}`,
                params: { resource: "role", timestamp: expect.any(String) },
            });
            expect(mapped.cause).toBe(error);
            expect(ExceptionMapper.isORM(mapped)).toBe(true);
            expect(ExceptionMapper.fromORM(mapped)).toBe(mapped);
            expect(ExceptionMapper.isORM(error)).toBe(false);
        });

        it("keeps the driver code on a generic driver failure", () => {
            const error = new DriverException(Object.assign(new Error("driver failure"), { code: "XX000" }));

            const mapped = ExceptionMapper.fromORM(error);

            expect(mapped).toMatchObject({
                statusCode: 500,
                kind: ErrorKind.INTERNAL,
                code: ErrorCode.INTERNAL,
                messageKey: "db.INTERNAL_DRIVER_ERROR",
                params: { code: "XX000" },
            });
            expect(mapped.cause).toBe(error);
            expect(ExceptionMapper.isORM(mapped)).toBe(true);
        });

        it("passes external dependency failures through without marking them as ORM failures", () => {
            const error = Exception.externalServiceFailed({ messageKey: "vault.failed" });

            expect(ExceptionMapper.fromORM(error, "role")).toBe(error);
            expect(ExceptionMapper.isORM(error)).toBe(false);
        });

        it.each([new Error("unexpected"), null, undefined, "failure", { message: "not an Error" }])(
            "wraps unknown errors without classifying them as ORM: %s",
            (error) => {
                const mapped = ExceptionMapper.fromORM(error, "role");

                expect(mapped).toMatchObject({
                    statusCode: 500,
                    kind: ErrorKind.INTERNAL,
                    code: ErrorCode.INTERNAL,
                    messageKey: "db.INTERNAL_DRIVER_ERROR",
                    params: { resource: "role" },
                });
                expect(mapped.cause).toBe(error);
                expect(ExceptionMapper.isORM(mapped)).toBe(false);
                expect(ExceptionMapper.isORM(error)).toBe(false);
            },
        );

        it("does not infer ORM origin from matching public properties", () => {
            const mapped = ExceptionMapper.fromORM(new DeadlockException(new Error("deadlock")));

            expect(ExceptionMapper.isORM(new Exception(mapped))).toBe(false);
        });
    });
});
