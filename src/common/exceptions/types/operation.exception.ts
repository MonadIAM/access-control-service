import { HttpStatus } from "@nestjs/common";

import { OperationErrorKind } from "../error-kinds";
import { BaseException } from "./base.exception";

export class OperationException extends BaseException {
    private constructor(
        kind: Exception.OperationErrorKind,
        statusCode: number,
        messageKey: string,
        params?: Record<string, unknown>,
    ) {
        super(kind, statusCode, messageKey, params);
    }

    public static badRequest(messageKey = "operation.bad_request", params?: Record<string, unknown>): OperationException {
        return new OperationException(OperationErrorKind.BadRequest, HttpStatus.BAD_REQUEST, messageKey, params);
    }

    public static forbidden(messageKey = "operation.forbidden", params?: Record<string, unknown>): OperationException {
        return new OperationException(OperationErrorKind.Forbidden, HttpStatus.FORBIDDEN, messageKey, params);
    }

    public static notFound(messageKey = "operation.not_found", params?: Record<string, unknown>): OperationException {
        return new OperationException(OperationErrorKind.NotFound, HttpStatus.NOT_FOUND, messageKey, params);
    }

    public static conflict(messageKey = "operation.conflict", params?: Record<string, unknown>): OperationException {
        return new OperationException(OperationErrorKind.Conflict, HttpStatus.CONFLICT, messageKey, params);
    }

    public static internal(messageKey = "operation.internal_error", params?: Record<string, unknown>): OperationException {
        return new OperationException(OperationErrorKind.Internal, HttpStatus.INTERNAL_SERVER_ERROR, messageKey, params);
    }

    public static unauthorized(
        messageKey = "operation.unauthorized",
        params?: Record<string, unknown>,
    ): OperationException {
        return new OperationException(OperationErrorKind.Unauthorized, HttpStatus.UNAUTHORIZED, messageKey, params);
    }

    public static unprocessable(
        messageKey = "operation.unprocessable",
        params?: Record<string, unknown>,
    ): OperationException {
        return new OperationException(
            OperationErrorKind.Unprocessable,
            HttpStatus.UNPROCESSABLE_ENTITY,
            messageKey,
            params,
        );
    }
}
