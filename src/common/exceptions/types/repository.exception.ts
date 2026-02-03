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
import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";
import { RepositoryErrorKind } from "../enums";

export class RepositoryException extends BaseException {
    private constructor(kind: RepositoryErrorKind, statusCode: number, key: string, params?: Record<string, unknown>) {
        super(kind, statusCode, key, params);
    }

    public static fromOrmError(error: unknown, resource?: string): RepositoryException | Error {
        const params = { resource, timestamp: new Date().toISOString() };

        if (error instanceof RepositoryException) {
            return error;
        }

        if (error instanceof NotFoundError) {
            return new RepositoryException(RepositoryErrorKind.NotFound, 404, "db.not_found", params);
        }
        if (error instanceof UniqueConstraintViolationException) {
            return new RepositoryException(RepositoryErrorKind.UniqueViolation, 409, "db.unique_violation", params);
        }
        if (error instanceof ForeignKeyConstraintViolationException) {
            return new RepositoryException(RepositoryErrorKind.ForeignKeyViolation, 409, "db.fk_violation", params);
        }
        if (error instanceof NotNullConstraintViolationException) {
            return new RepositoryException(RepositoryErrorKind.NotNullViolation, 400, "db.not_null_violation", params);
        }

        if (error instanceof DeadlockException) {
            return new RepositoryException(RepositoryErrorKind.Deadlock, 409, "db.deadlock", params);
        }
        if (error instanceof LockWaitTimeoutException) {
            return new RepositoryException(RepositoryErrorKind.Timeout, 408, "db.lock_timeout", params);
        }
        if (error instanceof ConnectionException) {
            return new RepositoryException(RepositoryErrorKind.ConnectionError, 503, "db.connection_lost", params);
        }

        if (error instanceof DriverException) {
            return new RepositoryException(RepositoryErrorKind.Internal, 500, "db.internal_driver_error", {
                ...params,
                code: error.code,
            });
        }

        return error as Error;
    }

    public static badRequest(
        key: string = "repository.bad_request",
        params?: Record<string, unknown>,
    ): RepositoryException {
        return new RepositoryException(RepositoryErrorKind.InvariantViolation, HttpStatus.BAD_REQUEST, key, params);
    }

    public static notFound(params?: Record<string, unknown>): RepositoryException {
        return new RepositoryException(RepositoryErrorKind.NotFound, HttpStatus.NOT_FOUND, "repository.not_found", params);
    }

    public static uniqueViolation(params?: Record<string, unknown>): RepositoryException {
        return new RepositoryException(
            RepositoryErrorKind.UniqueViolation,
            HttpStatus.CONFLICT,
            "repository.unique_violation",
            params,
        );
    }

    public static foreignKeyViolation(params?: Record<string, unknown>): RepositoryException {
        return new RepositoryException(
            RepositoryErrorKind.ForeignKeyViolation,
            HttpStatus.CONFLICT,
            "repository.fk_violation",
            params,
        );
    }
}
