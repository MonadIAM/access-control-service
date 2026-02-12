import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";
import { RepositoryErrorKind } from "../error-kinds";

export class RepositoryException extends BaseException {
    private constructor(
        kind: Exception.RepositoryErrorKind,
        statusCode: number,
        messageKey: string,
        params?: Record<string, unknown>,
    ) {
        super(kind, statusCode, messageKey, params);
    }

    public static notFound(messageKey = "repository.not_found", params?: Record<string, unknown>): RepositoryException {
        return new RepositoryException(RepositoryErrorKind.NotFound, HttpStatus.NOT_FOUND, messageKey, params);
    }
}
