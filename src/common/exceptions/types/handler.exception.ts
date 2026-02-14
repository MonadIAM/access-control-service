import { BaseException } from "./base.exception";

export class HandlerException extends BaseException {
    private constructor(
        kind: Exception.EntityErrorKind,
        statusCode: number,
        messageKey: string,
        params?: Record<string, unknown>,
    ) {
        super(kind, statusCode, messageKey, params);
    }
}
