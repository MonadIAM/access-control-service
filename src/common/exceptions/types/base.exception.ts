import { HttpStatus } from "@nestjs/common";
import {
    ForeignKeyConstraintViolationException,
    NotNullConstraintViolationException,
    UniqueConstraintViolationException,
    LockWaitTimeoutException,
    ConnectionException,
    DeadlockException,
    DriverException,
    NotFoundError,
} from "@mikro-orm/core";

import { DatabaseErrorKind } from "../error-kinds";

export abstract class BaseException extends Error {
    public readonly timestamp: string;

    public constructor(
        public readonly kind: string,
        public readonly statusCode: number,
        public readonly messageKey: string,
        public readonly params?: Record<string, unknown>,
        public readonly details?: Exception.ValidationDetail[],
    ) {
        super(messageKey);
        Object.setPrototypeOf(this, new.target.prototype);
        this.timestamp = new Date().toISOString();
    }

    public static fromOrmError(error: unknown, resource?: string): Class | Error {
        const params = { resource, timestamp: new Date().toISOString() };

        if (error instanceof BaseException) {
            return error;
        }

        if (error instanceof NotFoundError) {
            return Reflect.construct(this, [DatabaseErrorKind.NotFound, HttpStatus.NOT_FOUND, "db.not_found", params]);
        }
        if (error instanceof DeadlockException) {
            return Reflect.construct(this, [DatabaseErrorKind.Deadlock, HttpStatus.CONFLICT, "db.deadlock", params]);
        }
        if (error instanceof ConnectionException) {
            return Reflect.construct(this, [
                DatabaseErrorKind.ConnectionError,
                HttpStatus.SERVICE_UNAVAILABLE,
                "db.connection_lost",
                params,
            ]);
        }
        if (error instanceof NotNullConstraintViolationException) {
            return Reflect.construct(this, [
                DatabaseErrorKind.NotNullViolation,
                HttpStatus.BAD_REQUEST,
                "db.not_null_violation",
                params,
            ]);
        }
        if (error instanceof UniqueConstraintViolationException) {
            return Reflect.construct(this, [
                DatabaseErrorKind.UniqueViolation,
                HttpStatus.CONFLICT,
                "db.unique_violation",
                params,
            ]);
        }
        if (error instanceof ForeignKeyConstraintViolationException) {
            return Reflect.construct(this, [
                DatabaseErrorKind.ForeignKeyViolation,
                HttpStatus.CONFLICT,
                "db.fk_violation",
                params,
            ]);
        }
        if (error instanceof LockWaitTimeoutException) {
            return Reflect.construct(this, [
                DatabaseErrorKind.Timeout,
                HttpStatus.REQUEST_TIMEOUT,
                "db.lock_timeout",
                params,
            ]);
        }
        if (error instanceof DriverException) {
            return Reflect.construct(this, [
                DatabaseErrorKind.Internal,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "db.internal_driver_error",
                {
                    ...params,
                    code: error.code,
                },
            ]);
        }

        return error as Error;
    }
}
