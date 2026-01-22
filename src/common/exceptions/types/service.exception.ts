import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";
import { ServiceErrorKind } from "../enums";

export class ServiceException extends BaseException {
    private constructor(
        kind: ServiceErrorKind,
        statusCode: HttpStatus,
        key: string,
        params?: Record<string, unknown>,
        details?: Exception.ValidationDetail[],
    ) {
        super(kind, statusCode, key, params, details);
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

    public static badRequest(key = "service.bad_request", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.BadRequest, HttpStatus.BAD_REQUEST, key, params);
    }

    public static unauthorized(key = "service.unauthorized", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.Unauthorized, HttpStatus.UNAUTHORIZED, key, params);
    }

    public static forbidden(key = "service.forbidden", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.Forbidden, HttpStatus.FORBIDDEN, key, params);
    }

    public static notFound(key = "service.not_found", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.NotFound, HttpStatus.NOT_FOUND, key, params);
    }

    public static conflict(key = "service.conflict", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.Conflict, HttpStatus.CONFLICT, key, params);
    }

    public static unprocessable(key = "service.unprocessable", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.Unprocessable, HttpStatus.UNPROCESSABLE_ENTITY, key, params);
    }

    public static internal(key = "service.internal_error", params?: Record<string, unknown>): ServiceException {
        return new ServiceException(ServiceErrorKind.Internal, HttpStatus.INTERNAL_SERVER_ERROR, key, params);
    }
}
