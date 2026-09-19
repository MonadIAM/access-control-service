import { HttpStatus } from "@nestjs/common";
import { isString } from "class-validator";

import { ErrorCode, ErrorKind } from "./enums";

const TRANSIENT_CODES = new Set(["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "EAI_AGAIN", "ENETUNREACH"]);
const TRANSIENT_REDIS_REPLIES = /^(LOADING|TRYAGAIN|CLUSTERDOWN|MASTERDOWN|READONLY|BUSY)\b/;
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
        if (error instanceof Exception) {
            return error.kind === ErrorKind.DEADLOCK || RETRYABLE_STATUSES.has(error.statusCode);
        } else if (error instanceof Error) {
            const code: unknown = Reflect.get(error, "code");
            return (
                (isString(code) && TRANSIENT_CODES.has(code)) ||
                error.name === "MaxRetriesPerRequestError" ||
                error.message === "Connection is closed." ||
                (error.name === "ReplyError" && TRANSIENT_REDIS_REPLIES.test(error.message))
            );
        } else {
            return false;
        }
    }

    public static badRequest(props: Exception.StatusProps): Exception {
        return new Exception({
            code: props.code ?? ErrorCode.BAD_REQUEST,
            statusCode: HttpStatus.BAD_REQUEST,
            kind: ErrorKind.BAD_REQUEST,
            ...props,
        });
    }

    public static unauthorized(props: Exception.StatusProps): Exception {
        return new Exception({
            code: props.code ?? ErrorCode.UNAUTHORIZED,
            statusCode: HttpStatus.UNAUTHORIZED,
            kind: ErrorKind.UNAUTHORIZED,
            ...props,
        });
    }

    public static forbidden(props: Exception.StatusProps): Exception {
        return new Exception({
            code: props.code ?? ErrorCode.FORBIDDEN,
            statusCode: HttpStatus.FORBIDDEN,
            kind: ErrorKind.FORBIDDEN,
            ...props,
        });
    }

    public static methodNotAllowed(props: Exception.StatusProps): Exception {
        return new Exception({
            code: props.code ?? ErrorCode.METHOD_NOT_ALLOWED,
            statusCode: HttpStatus.METHOD_NOT_ALLOWED,
            kind: ErrorKind.METHOD_NOT_ALLOWED,
            ...props,
        });
    }

    public static notFound(props: Exception.StatusProps): Exception {
        return new Exception({
            code: props.code ?? ErrorCode.NOT_FOUND,
            statusCode: HttpStatus.NOT_FOUND,
            kind: ErrorKind.NOT_FOUND,
            ...props,
        });
    }

    public static conflict(props: Exception.StatusProps): Exception {
        return new Exception({
            code: props.code ?? ErrorCode.CONFLICT,
            statusCode: HttpStatus.CONFLICT,
            kind: ErrorKind.CONFLICT,
            ...props,
        });
    }

    public static internal(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            code: props.code ?? ErrorCode.INTERNAL,
            kind: ErrorKind.INTERNAL,
            ...props,
        });
    }

    public static unprocessable(props: Exception.StatusProps): Exception {
        return new Exception({
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            code: props.code ?? ErrorCode.UNPROCESSABLE,
            kind: ErrorKind.UNPROCESSABLE,
            ...props,
        });
    }

    public static invariantViolation(props: Exception.StatusProps): Exception {
        return new Exception({
            code: props.code ?? ErrorCode.INVARIANT_VIOLATION,
            kind: ErrorKind.INVARIANT_VIOLATION,
            statusCode: HttpStatus.BAD_REQUEST,
            ...props,
        });
    }

    public static externalServiceFailed(props: Exception.StatusProps): Exception {
        return new Exception({
            code: props.code ?? ErrorCode.EXTERNAL_SERVICE_FAILED,
            kind: ErrorKind.EXTERNAL_SERVICE_FAILED,
            statusCode: HttpStatus.BAD_GATEWAY,
            ...props,
        });
    }

    public static externalAuthnFailed(props: Exception.StatusProps): Exception {
        return new Exception({
            code: props.code ?? ErrorCode.EXTERNAL_AUTHN_FAILED,
            kind: ErrorKind.EXTERNAL_AUTHN_FAILED,
            statusCode: HttpStatus.UNAUTHORIZED,
            ...props,
        });
    }

    public static validationFailed(details: Exception.ValidationDetail[]): Exception {
        return new Exception({
            messageKey: `${this.dictionaryPath}.COMMON_ERROR`,
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            code: ErrorCode.UNPROCESSABLE,
            kind: ErrorKind.UNPROCESSABLE,
            details,
        });
    }
}
