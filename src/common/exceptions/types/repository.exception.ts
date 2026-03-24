import { BaseException } from "./base.exception";

export class RepositoryException extends BaseException {
    private constructor(
        kind: Exception.RepositoryErrorKind,
        statusCode: number,
        messageKey: string,
        params?: UnknownObject,
    ) {
        super(kind, statusCode, messageKey, params);
    }
}
