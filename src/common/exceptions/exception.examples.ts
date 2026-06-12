import { HttpStatus } from "@nestjs/common";

import { ErrorCode, ErrorKind } from "./enums";

export const EXCEPTION_EXAMPLES = {
    [HttpStatus.BAD_REQUEST]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/resource",
        statusCode: 400,
        error: ErrorKind.BAD_REQUEST,
        code: ErrorCode.BAD_REQUEST,
        message: "Business rule violation",
    },

    [HttpStatus.UNAUTHORIZED]: {
        timestamp: "2026-02-22T19:20:44.518Z",
        path: "/api/resource",
        statusCode: 401,
        error: ErrorKind.UNAUTHORIZED,
        code: ErrorCode.UNAUTHORIZED,
        message: "An authentication token is required.",
    },

    [HttpStatus.FORBIDDEN]: {
        timestamp: "2026-02-22T19:21:07.843Z",
        path: "/api/resource",
        statusCode: 403,
        error: ErrorKind.FORBIDDEN,
        code: ErrorCode.FORBIDDEN,
        message: "Insufficient permissions to perform this operation.",
    },

    [HttpStatus.NOT_FOUND]: {
        timestamp: "2026-02-22T19:23:01.235Z",
        path: "/api/resource",
        statusCode: 404,
        error: ErrorKind.NOT_FOUND,
        code: ErrorCode.NOT_FOUND,
        message: "Resource not found",
    },

    [HttpStatus.REQUEST_TIMEOUT]: {
        timestamp: "2026-02-22T19:22:49.384Z",
        path: "/api/resource",
        statusCode: 408,
        error: ErrorKind.TIMEOUT,
        code: ErrorCode.TIMEOUT,
        message: "Database lock wait timeout exceeded.",
    },

    [HttpStatus.CONFLICT]: {
        timestamp: "2026-02-22T19:22:15.692Z",
        path: "/api/resource",
        statusCode: 409,
        error: ErrorKind.UNIQUE_VIOLATION,
        code: ErrorCode.UNIQUE_VIOLATION,
        message: "Resource with this data already exists",
    },

    [HttpStatus.UNPROCESSABLE_ENTITY]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/resource",
        statusCode: 422,
        error: ErrorKind.UNPROCESSABLE,
        code: ErrorCode.UNPROCESSABLE,
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
        error: ErrorKind.INTERNAL,
        code: ErrorCode.INTERNAL,
        message: "Internal Server Error",
    },

    [HttpStatus.BAD_GATEWAY]: {
        timestamp: "2026-02-22T19:24:02.667Z",
        path: "/api/resource",
        statusCode: 502,
        error: ErrorKind.EXTERNAL_SERVICE_FAILED,
        code: ErrorCode.EXTERNAL_SERVICE_FAILED,
        message: "External service request failed.",
    },

    [HttpStatus.SERVICE_UNAVAILABLE]: {
        timestamp: "2026-02-22T19:24:31.762Z",
        path: "/api/resource",
        statusCode: 503,
        error: ErrorKind.CONNECTION_ERROR,
        code: ErrorCode.CONNECTION_ERROR,
        message: "The connection to the database was lost.",
    },
} as const;
