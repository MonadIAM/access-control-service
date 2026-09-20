import { HttpStatus } from "@nestjs/common";
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

import { ErrorCode, ErrorKind } from "./enums";
import { Exception } from "./exception";

export abstract class ExceptionMapper {
    private static readonly dictionaryPath = "db";

    private static readonly ormExceptions = new WeakSet<Exception>();

    private constructor() {}

    public static fromORM(error: unknown, resource?: string): Exception {
        if (error instanceof Exception) {
            return error;
        } else {
            const params = { resource, timestamp: new Date().toISOString() };

            if (error instanceof NotFoundError) {
                return this.createORMException({
                    code: ErrorCode.NOT_FOUND,
                    kind: ErrorKind.NOT_FOUND,
                    statusCode: HttpStatus.NOT_FOUND,
                    messageKey: `${this.dictionaryPath}.NOT_FOUND`,
                    cause: error,
                    params,
                });
            } else if (error instanceof OptimisticLockError) {
                return this.createORMException({
                    code: ErrorCode.CONFLICT,
                    kind: ErrorKind.CONFLICT,
                    statusCode: HttpStatus.CONFLICT,
                    messageKey: `${this.dictionaryPath}.CONCURRENT_MODIFICATION`,
                    cause: error,
                    params,
                });
            } else if (error instanceof DeadlockException) {
                return this.createORMException({
                    code: ErrorCode.DEADLOCK,
                    kind: ErrorKind.DEADLOCK,
                    statusCode: HttpStatus.CONFLICT,
                    messageKey: `${this.dictionaryPath}.DEADLOCK`,
                    cause: error,
                    params,
                });
            } else if (error instanceof ConnectionException) {
                return this.createORMException({
                    code: ErrorCode.CONNECTION_ERROR,
                    kind: ErrorKind.CONNECTION_ERROR,
                    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                    messageKey: `${this.dictionaryPath}.CONNECTION_LOST`,
                    cause: error,
                    params,
                });
            } else if (error instanceof NotNullConstraintViolationException) {
                return this.createORMException({
                    code: ErrorCode.NOT_NULL_VIOLATION,
                    kind: ErrorKind.NOT_NULL_VIOLATION,
                    statusCode: HttpStatus.BAD_REQUEST,
                    messageKey: `${this.dictionaryPath}.NOT_NULL_VIOLATION`,
                    cause: error,
                    params,
                });
            } else if (error instanceof UniqueConstraintViolationException) {
                return this.createORMException({
                    code: ErrorCode.UNIQUE_VIOLATION,
                    kind: ErrorKind.UNIQUE_VIOLATION,
                    statusCode: HttpStatus.CONFLICT,
                    messageKey: `${this.dictionaryPath}.UNIQUE_VIOLATION`,
                    cause: error,
                    params,
                });
            } else if (error instanceof ForeignKeyConstraintViolationException) {
                return this.createORMException({
                    code: ErrorCode.FOREIGN_KEY_VIOLATION,
                    kind: ErrorKind.FOREIGN_KEY_VIOLATION,
                    statusCode: HttpStatus.CONFLICT,
                    messageKey: `${this.dictionaryPath}.FK_VIOLATION`,
                    cause: error,
                    params,
                });
            } else if (error instanceof LockWaitTimeoutException) {
                return this.createORMException({
                    code: ErrorCode.TIMEOUT,
                    kind: ErrorKind.TIMEOUT,
                    statusCode: HttpStatus.REQUEST_TIMEOUT,
                    messageKey: `${this.dictionaryPath}.LOCK_TIMEOUT`,
                    cause: error,
                    params,
                });
            } else if (error instanceof DriverException) {
                return this.createORMException({
                    code: ErrorCode.INTERNAL,
                    kind: ErrorKind.INTERNAL,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    messageKey: `${this.dictionaryPath}.INTERNAL_DRIVER_ERROR`,
                    cause: error,
                    params: {
                        ...params,
                        code: error.code,
                    },
                });
            } else {
                return new Exception({
                    code: ErrorCode.INTERNAL,
                    kind: ErrorKind.INTERNAL,
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    messageKey: `${this.dictionaryPath}.INTERNAL_DRIVER_ERROR`,
                    cause: error,
                    params,
                });
            }
        }
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
