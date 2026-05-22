import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";
import { EntityErrorKind } from "../error-kinds";

export class EntityException extends BaseException {
    private constructor(kind: Exception.EntityErrorKind, statusCode: number, messageKey: string, params?: UnknownObject) {
        super(kind, statusCode, messageKey, params);
    }

    public static invariantViolation(
        messageKey = "fallback.entity.INVARIANT_VIOLATION",
        params?: UnknownObject,
    ): EntityException {
        return new EntityException(EntityErrorKind.InvariantViolation, HttpStatus.BAD_REQUEST, messageKey, params);
    }
}
