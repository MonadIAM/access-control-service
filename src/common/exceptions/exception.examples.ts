import { HttpStatus } from "@nestjs/common";

export const EXCEPTION_EXAMPLES = {
    [HttpStatus.BAD_REQUEST]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/resource",
        statusCode: 400,
        error: "BadRequest",
        message: "Business rule violation",
    },

    [HttpStatus.UNAUTHORIZED]: {
        timestamp: "2026-02-22T19:20:44.518Z",
        path: "/api/resource",
        statusCode: 401,
        error: "Unauthorized",
        message: "An authentication token is required.",
    },

    [HttpStatus.FORBIDDEN]: {
        timestamp: "2026-02-22T19:21:07.843Z",
        path: "/api/resource",
        statusCode: 403,
        error: "Forbidden",
        message: "Insufficient permissions to perform this operation.",
    },

    [HttpStatus.NOT_FOUND]: {
        timestamp: "2026-02-22T19:23:01.235Z",
        path: "/api/resource",
        statusCode: 404,
        error: "NotFound",
        message: "Resource not found",
    },

    [HttpStatus.REQUEST_TIMEOUT]: {
        timestamp: "2026-02-22T19:22:49.384Z",
        path: "/api/resource",
        statusCode: 408,
        error: "DatabaseTimeout",
        message: "Database lock wait timeout exceeded.",
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

    [HttpStatus.BAD_GATEWAY]: {
        timestamp: "2026-02-22T19:24:02.667Z",
        path: "/api/resource",
        statusCode: 502,
        error: "ExternalServiceFailed",
        message: "External service request failed.",
    },

    [HttpStatus.SERVICE_UNAVAILABLE]: {
        timestamp: "2026-02-22T19:24:31.762Z",
        path: "/api/resource",
        statusCode: 503,
        error: "DatabaseConnectionError",
        message: "The connection to the database was lost.",
    },
} as const;
