import { HttpStatus } from "@nestjs/common";

import { ErrorCode, ErrorKind } from "./enums";

const RETRYABLE_STATUSES = new Set<number>([
    HttpStatus.INTERNAL_SERVER_ERROR,
    HttpStatus.SERVICE_UNAVAILABLE,
    HttpStatus.GATEWAY_TIMEOUT,
    HttpStatus.REQUEST_TIMEOUT,
    HttpStatus.BAD_GATEWAY,
]);

export class Exception extends Error {
    private static readonly dictionaryPath = "validator";

    public readonly timestamp: string;

    public readonly statusCode: number;
    public readonly messageKey: string;
    public readonly kind: ErrorKind;
    public readonly code: ErrorCode;

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
        this.code = props.code;

        this.details = props.details;
        this.headers = props.headers;
        this.params = props.params;
        this.cause = props.cause;
    }

    public static isRetryable(error: unknown): error is Exception {
        return (
            error instanceof Exception && (error.kind === ErrorKind.DEADLOCK || RETRYABLE_STATUSES.has(error.statusCode))
        );
    }

    public static badRequest(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.BAD_REQUEST,
            kind: ErrorKind.BAD_REQUEST,
            ...props,
            code: props.code ?? ErrorCode.BAD_REQUEST,
        });
    }

    public static unauthorized(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.UNAUTHORIZED,
            kind: ErrorKind.UNAUTHORIZED,
            ...props,
            code: props.code ?? ErrorCode.UNAUTHORIZED,
        });
    }

    public static forbidden(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.FORBIDDEN,
            kind: ErrorKind.FORBIDDEN,
            ...props,
            code: props.code ?? ErrorCode.FORBIDDEN,
        });
    }

    public static methodNotAllowed(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.METHOD_NOT_ALLOWED,
            kind: ErrorKind.METHOD_NOT_ALLOWED,
            ...props,
            code: props.code ?? ErrorCode.METHOD_NOT_ALLOWED,
        });
    }

    public static notFound(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.NOT_FOUND,
            kind: ErrorKind.NOT_FOUND,
            ...props,
            code: props.code ?? ErrorCode.NOT_FOUND,
        });
    }

    public static conflict(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.CONFLICT,
            kind: ErrorKind.CONFLICT,
            ...props,
            code: props.code ?? ErrorCode.CONFLICT,
        });
    }

    public static internal(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            kind: ErrorKind.INTERNAL,
            ...props,
            code: props.code ?? ErrorCode.INTERNAL,
        });
    }

    public static unprocessable(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            kind: ErrorKind.UNPROCESSABLE,
            ...props,
            code: props.code ?? ErrorCode.UNPROCESSABLE,
        });
    }

    public static invariantViolation(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.BAD_REQUEST,
            kind: ErrorKind.INVARIANT_VIOLATION,
            ...props,
            code: props.code ?? ErrorCode.INVARIANT_VIOLATION,
        });
    }

    public static externalServiceFailed(props: Exception.StatusProps): Exception {
        return new Exception({
            kind: ErrorKind.EXTERNAL_SERVICE_FAILED,
            statusCode: HttpStatus.BAD_GATEWAY,
            ...props,
            code: props.code ?? ErrorCode.EXTERNAL_SERVICE_FAILED,
        });
    }

    public static externalAuthnFailed(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.UNAUTHORIZED,
            kind: ErrorKind.EXTERNAL_AUTHN_FAILED,
            ...props,
            code: props.code ?? ErrorCode.EXTERNAL_AUTHN_FAILED,
        });
    }

    public static validationFailed(details: Exception.ValidationDetail[]): Exception {
        return new Exception({
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            messageKey: `${this.dictionaryPath}.COMMON_ERROR`,
            code: ErrorCode.UNPROCESSABLE,
            kind: ErrorKind.UNPROCESSABLE,
            details,
        });
    }
}
