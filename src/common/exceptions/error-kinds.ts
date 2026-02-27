export const CommonErrorKind = {
    Internal: "Internal",
} as const;

export const DatabaseErrorKind = {
    ForeignKeyViolation: "ForeignKeyViolation",
    ConnectionError: "DatabaseConnectionError",
    NotNullViolation: "NotNullViolation",
    UniqueViolation: "UniqueViolation",
    Deadlock: "DatabaseDeadlock",
    Timeout: "DatabaseTimeout",
    NotFound: "NotFound",
    ...CommonErrorKind,
} as const;

export const EntityErrorKind = {
    InvariantViolation: "InvariantViolation",
} as const;

export const ServiceErrorKind = {
    InvariantViolation: "InvariantViolation",
    Unprocessable: "Unprocessable",
} as const;

export const RepositoryErrorKind = {
    ...DatabaseErrorKind,
} as const;

export const HandlerErrorKind = {
    Unprocessable: "Unprocessable",
    Unauthorized: "Unauthorized",
    BadRequest: "BadRequest",
    Forbidden: "Forbidden",
    Conflict: "Conflict",
    ...DatabaseErrorKind,
} as const;

export const GuardErrorKind = {
    Unauthorized: "Unauthorized",
    Forbidden: "Forbidden",
} as const;
