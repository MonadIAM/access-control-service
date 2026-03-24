import { HttpStatus } from "@nestjs/common";

import { GuardErrorKind } from "../error-kinds";
import { BaseException } from "./base.exception";

export class GuardException extends BaseException {
    private constructor(kind: Exception.GuardErrorKind, statusCode: number, messageKey: string, params?: UnknownObject) {
        super(kind, statusCode, messageKey, params);
    }

    public static unauthorized(messageKey = "guard.unauthorized", params?: UnknownObject): GuardException {
        return new GuardException(GuardErrorKind.Unauthorized, HttpStatus.UNAUTHORIZED, messageKey, params);
    }

    public static forbidden(messageKey = "guard.forbidden", params?: UnknownObject): GuardException {
        return new GuardException(GuardErrorKind.Forbidden, HttpStatus.FORBIDDEN, messageKey, params);
    }
}
