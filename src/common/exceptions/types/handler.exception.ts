import { HttpStatus } from "@nestjs/common";

import { HandlerErrorKind } from "../error-kinds";
import { BaseException } from "./base.exception";

export class HandlerException extends BaseException {
    private constructor(
        kind: Exception.HandlerErrorKind,
        statusCode: number,
        messageKey: string,
        params?: Record<string, unknown>,
    ) {
        super(kind, statusCode, messageKey, params);
    }

    public static badRequest(messageKey = "handler.bad_request", params?: Record<string, unknown>): HandlerException {
        return new HandlerException(HandlerErrorKind.BadRequest, HttpStatus.BAD_REQUEST, messageKey, params);
    }

    public static unauthorized(messageKey = "handler.unauthorized", params?: Record<string, unknown>): HandlerException {
        return new HandlerException(HandlerErrorKind.Unauthorized, HttpStatus.UNAUTHORIZED, messageKey, params);
    }

    public static forbidden(messageKey = "handler.forbidden", params?: Record<string, unknown>): HandlerException {
        return new HandlerException(HandlerErrorKind.Forbidden, HttpStatus.FORBIDDEN, messageKey, params);
    }

    public static notFound(messageKey = "handler.not_found", params?: Record<string, unknown>): HandlerException {
        return new HandlerException(HandlerErrorKind.NotFound, HttpStatus.NOT_FOUND, messageKey, params);
    }

    public static conflict(messageKey = "handler.conflict", params?: Record<string, unknown>): HandlerException {
        return new HandlerException(HandlerErrorKind.Conflict, HttpStatus.CONFLICT, messageKey, params);
    }

    public static unprocessable(messageKey = "handler.unprocessable", params?: Record<string, unknown>): HandlerException {
        return new HandlerException(HandlerErrorKind.Unprocessable, HttpStatus.UNPROCESSABLE_ENTITY, messageKey, params);
    }

    public static internal(messageKey = "handler.internal_error", params?: Record<string, unknown>): HandlerException {
        return new HandlerException(HandlerErrorKind.Internal, HttpStatus.INTERNAL_SERVER_ERROR, messageKey, params);
    }
}
