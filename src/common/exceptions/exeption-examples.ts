import { HttpStatus } from "@nestjs/common";

export const EXCEPTION_EXAMPLES = {
    [HttpStatus.BAD_REQUEST]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/resource",
        statusCode: 400,
        error: "BadRequest",
        message: "Business rule violation",
    },

    [HttpStatus.NOT_FOUND]: {
        timestamp: "2026-02-22T19:23:01.235Z",
        path: "/api/resource",
        statusCode: 404,
        error: "NotFound",
        message: "Resource not found",
    },

    [HttpStatus.CONFLICT]: {
        timestamp: "2026-02-22T19:22:15.692Z",
        path: "/api/resource",
        statusCode: 409,
        error: "UniqueViolation",
        message: "Resource with this data already exists",
    },

    [HttpStatus.UNPROCESSABLE_ENTITY]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/resource",
        statusCode: 422,
        error: "Unprocessable",
        message: "Validation failed",
        details: [
            {
                path: "code",
                constraint: "isString",
                invalidValue: 123,
                message: 'Field "code" must be a string',
            },
        ],
    },

    [HttpStatus.INTERNAL_SERVER_ERROR]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/resource",
        statusCode: 500,
        error: "InternalServerError",
        message: "Internal Server Error",
    },
} as const;
