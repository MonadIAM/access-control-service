import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";
import { EntityErrorKind } from "../error-kinds";

export class EntityException extends BaseException {
    private constructor(
        kind: Exception.EntityErrorKind,
        statusCode: number,
        messageKey: string,
        params?: Record<string, unknown>,
    ) {
        super(kind, statusCode, messageKey, params);
    }

    public static invariantViolation(
        messageKey = "entity.invariant_violation",
        params?: Record<string, unknown>,
    ): EntityException {
        return new EntityException(EntityErrorKind.InvariantViolation, HttpStatus.BAD_REQUEST, messageKey, params);
    }
}
