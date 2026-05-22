import { HttpStatus } from "@nestjs/common";

import { RepositoryErrorKind } from "../error-kinds";
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

    public static notFound(messageKey = "fallback.repository.NOT_FOUND", params?: UnknownObject): RepositoryException {
        return new RepositoryException(RepositoryErrorKind.NotFound, HttpStatus.NOT_FOUND, messageKey, params);
    }
}
