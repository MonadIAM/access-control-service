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

import { ErrorKind } from "./enums";
import { Exception } from "./exception";

export abstract class ExceptionMapper {
    private static readonly ormExceptions = new WeakSet<Exception>();

    private constructor() {}

    public static fromORM(error: unknown, resource?: string): Exception {
        if (error instanceof Exception) {
            return error;
        }

        const params = { resource, timestamp: new Date().toISOString() };

        if (error instanceof NotFoundError) {
            return this.createORMException({
                kind: ErrorKind.NotFound,
                statusCode: HttpStatus.NOT_FOUND,
                messageKey: "db.NOT_FOUND",
                cause: error,
                params,
            });
        }
        if (error instanceof DeadlockException) {
            return this.createORMException({
                kind: ErrorKind.Deadlock,
                statusCode: HttpStatus.CONFLICT,
                messageKey: "db.DEADLOCK",
                cause: error,
                params,
            });
        }
        if (error instanceof ConnectionException) {
            return this.createORMException({
                kind: ErrorKind.ConnectionError,
                statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                messageKey: "db.CONNECTION_LOST",
                cause: error,
                params,
            });
        }
        if (error instanceof NotNullConstraintViolationException) {
            return this.createORMException({
                kind: ErrorKind.NotNullViolation,
                statusCode: HttpStatus.BAD_REQUEST,
                messageKey: "db.NOT_NULL_VIOLATION",
                cause: error,
                params,
            });
        }
        if (error instanceof UniqueConstraintViolationException) {
            return this.createORMException({
                kind: ErrorKind.UniqueViolation,
                statusCode: HttpStatus.CONFLICT,
                messageKey: "db.UNIQUE_VIOLATION",
                cause: error,
                params,
            });
        }
        if (error instanceof ForeignKeyConstraintViolationException) {
            return this.createORMException({
                kind: ErrorKind.ForeignKeyViolation,
                statusCode: HttpStatus.CONFLICT,
                messageKey: "db.FK_VIOLATION",
                cause: error,
                params,
            });
        }
        if (error instanceof LockWaitTimeoutException) {
            return this.createORMException({
                kind: ErrorKind.Timeout,
                statusCode: HttpStatus.REQUEST_TIMEOUT,
                messageKey: "db.LOCK_TIMEOUT",
                cause: error,
                params,
            });
        }
        if (error instanceof DriverException) {
            return this.createORMException({
                kind: ErrorKind.Internal,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                messageKey: "db.INTERNAL_DRIVER_ERROR",
                cause: error,
                params: {
                    ...params,
                    code: error.code,
                },
            });
        }

        return new Exception({
            kind: ErrorKind.Internal,
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            messageKey: "db.INTERNAL_DRIVER_ERROR",
            cause: error,
            params,
        });
    }

    public static isORM(error: unknown): error is Exception {
        return error instanceof Exception && this.ormExceptions.has(error);
    }

    private static createORMException(props: Exception.Props): Exception {
        const exception = new Exception(props);
        this.ormExceptions.add(exception);
        return exception;
    }
}
