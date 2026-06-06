import { HttpStatus } from "@nestjs/common";

import { ErrorKind } from "./enums";

const RETRYABLE_STATUSES = new Set<number>([
    HttpStatus.INTERNAL_SERVER_ERROR,
    HttpStatus.SERVICE_UNAVAILABLE,
    HttpStatus.GATEWAY_TIMEOUT,
    HttpStatus.REQUEST_TIMEOUT,
    HttpStatus.BAD_GATEWAY,
]);

export class Exception extends Error {
    public readonly timestamp: string;

    public readonly statusCode: number;
    public readonly messageKey: string;
    public readonly kind: ErrorKind;

    public readonly details?: Exception.ValidationDetail[];
    public readonly headers?: Exception.Headers;
    public readonly params?: UnknownObject;
    public readonly cause?: unknown;

    public constructor(props: Exception.Props) {
        super(props.messageKey);
        Object.setPrototypeOf(this, new.target.prototype);

        this.timestamp = new Date().toISOString();
        this.name = new.target.name;

        this.statusCode = props.statusCode;
        this.messageKey = props.messageKey;
        this.kind = props.kind;

        this.details = props.details;
        this.headers = props.headers;
        this.params = props.params;
        this.cause = props.cause;
    }

    public static isRetryable(error: unknown): error is Exception {
        return (
            error instanceof Exception && (error.kind === ErrorKind.Deadlock || RETRYABLE_STATUSES.has(error.statusCode))
        );
    }

    public static badRequest(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.BAD_REQUEST,
            kind: ErrorKind.BadRequest,
            ...props,
        });
    }

    public static unauthorized(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.UNAUTHORIZED,
            kind: ErrorKind.Unauthorized,
            ...props,
        });
    }

    public static forbidden(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.FORBIDDEN,
            kind: ErrorKind.Forbidden,
            ...props,
        });
    }

    public static notFound(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.NOT_FOUND,
            kind: ErrorKind.NotFound,
            ...props,
        });
    }

    public static conflict(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.CONFLICT,
            kind: ErrorKind.Conflict,
            ...props,
        });
    }

    public static internal(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            kind: ErrorKind.Internal,
            ...props,
        });
    }

    public static unprocessable(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            kind: ErrorKind.Unprocessable,
            ...props,
        });
    }

    public static invariantViolation(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.BAD_REQUEST,
            kind: ErrorKind.InvariantViolation,
            ...props,
        });
    }

    public static externalServiceFailed(props: Exception.StatusProps): Exception {
        return new Exception({
            kind: ErrorKind.ExternalServiceFailed,
            statusCode: HttpStatus.BAD_GATEWAY,
            ...props,
        });
    }

    public static externalAuthFailed(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.UNAUTHORIZED,
            kind: ErrorKind.ExternalAuthFailed,
            ...props,
        });
    }

    public static validationFailed(details: Exception.ValidationDetail[]): Exception {
        return new Exception({
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            messageKey: "validator.COMMON_ERROR",
            kind: ErrorKind.Unprocessable,
            details,
        });
    }
}
