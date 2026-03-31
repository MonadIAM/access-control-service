import { HttpStatus } from "@nestjs/common";

import { CommandErrorKind } from "../error-kinds";
import { BaseException } from "./base.exception";

export class CommandException extends BaseException {
    private constructor(kind: Exception.CommandErrorKind, statusCode: number, messageKey: string, params?: UnknownObject) {
        super(kind, statusCode, messageKey, params);
    }

    public static badRequest(messageKey = "command.bad_request", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.BadRequest, HttpStatus.BAD_REQUEST, messageKey, params);
    }

    public static forbidden(messageKey = "command.forbidden", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.Forbidden, HttpStatus.FORBIDDEN, messageKey, params);
    }

    public static notFound(messageKey = "command.not_found", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.NotFound, HttpStatus.NOT_FOUND, messageKey, params);
    }

    public static conflict(messageKey = "command.conflict", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.Conflict, HttpStatus.CONFLICT, messageKey, params);
    }

    public static internal(messageKey = "command.internal_error", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.Internal, HttpStatus.INTERNAL_SERVER_ERROR, messageKey, params);
    }

    public static unauthorized(messageKey = "command.unauthorized", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.Unauthorized, HttpStatus.UNAUTHORIZED, messageKey, params);
    }

    public static unprocessable(messageKey = "command.unprocessable", params?: UnknownObject): CommandException {
        return new CommandException(CommandErrorKind.Unprocessable, HttpStatus.UNPROCESSABLE_ENTITY, messageKey, params);
    }
}
