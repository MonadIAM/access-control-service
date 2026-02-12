import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";
import { ServiceErrorKind } from "../error-kinds";

export class ServiceException extends BaseException {
    private constructor(
        kind: Exception.ServiceErrorKind,
        statusCode: HttpStatus,
        messageKey: string,
        params?: Record<string, unknown>,
        details?: Exception.ValidationDetail[],
    ) {
        super(kind, statusCode, messageKey, params, details);
    }

    public static validationFailed(details: Exception.ValidationDetail[]): ServiceException {
        return new ServiceException(
            ServiceErrorKind.Unprocessable,
            HttpStatus.UNPROCESSABLE_ENTITY,
            "validatior.COMMON_ERROR",
            {},
            details,
        );
    }

    public static badRequest(messageKey = "service.bad_request", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.BadRequest, HttpStatus.BAD_REQUEST, messageKey, params);
    }

    public static unauthorized(messageKey = "service.unauthorized", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.Unauthorized, HttpStatus.UNAUTHORIZED, messageKey, params);
    }

    public static forbidden(messageKey = "service.forbidden", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.Forbidden, HttpStatus.FORBIDDEN, messageKey, params);
    }

    public static notFound(messageKey = "service.not_found", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.NotFound, HttpStatus.NOT_FOUND, messageKey, params);
    }

    public static conflict(messageKey = "service.conflict", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.Conflict, HttpStatus.CONFLICT, messageKey, params);
    }

    public static unprocessable(messageKey = "service.unprocessable", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.Unprocessable, HttpStatus.UNPROCESSABLE_ENTITY, messageKey, params);
    }

    public static internal(messageKey = "service.internal_error", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.Internal, HttpStatus.INTERNAL_SERVER_ERROR, messageKey, params);
    }
}
