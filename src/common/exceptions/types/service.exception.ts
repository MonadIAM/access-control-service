import { HttpStatus } from "@nestjs/common";

import { ServiceErrorKind } from "../error-kinds";
import { BaseException } from "./base.exception";

export class ServiceException extends BaseException {
    private constructor(
        kind: Exception.ServiceErrorKind,
        statusCode: number,
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

    public static invariantViolation(
        messageKey = "service.invariant_violation",
        params?: Record<string, unknown>,
    ): ServiceException {
        return new ServiceException(ServiceErrorKind.InvariantViolation, HttpStatus.BAD_REQUEST, messageKey, params);
    }
}
