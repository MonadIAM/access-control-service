import { HttpStatus } from "@nestjs/common";

import { CommandErrorKind } from "../error-kinds";
import { BaseException } from "./base.exception";

export class CommandException extends BaseException {
    private constructor(kind: Exception.CommandErrorKind, statusCode: number, messageKey: string, params?: UnknownObject) {
        super(kind, statusCode, messageKey, params);
    }

    public static badRequest(messageKey = "fallback.command.BAD_REQUEST", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.BadRequest, HttpStatus.BAD_REQUEST, messageKey, params);
    }

    public static forbidden(messageKey = "fallback.command.FORBIDDEN", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.Forbidden, HttpStatus.FORBIDDEN, messageKey, params);
    }

    public static notFound(messageKey = "fallback.command.NOT_FOUND", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.NotFound, HttpStatus.NOT_FOUND, messageKey, params);
    }

    public static conflict(messageKey = "fallback.command.CONFLICT", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.Conflict, HttpStatus.CONFLICT, messageKey, params);
    }

    public static internal(messageKey = "fallback.command.INTERNAL_ERROR", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.Internal, HttpStatus.INTERNAL_SERVER_ERROR, messageKey, params);
    }

    public static unauthorized(messageKey = "fallback.command.UNAUTHORIZED", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.Unauthorized, HttpStatus.UNAUTHORIZED, messageKey, params);
    }

    public static unprocessable(messageKey = "fallback.command.UNPROCESSABLE", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.Unprocessable, HttpStatus.UNPROCESSABLE_ENTITY, messageKey, params);
    }
}
