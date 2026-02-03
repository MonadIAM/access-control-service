export enum RepositoryErrorKind {
    InvariantViolation = "InvariantViolation",
    BadRequest = "RepositoryBadRequest",
    NotFound = "RepositoryNotFound",
    UniqueViolation = "UniqueViolation",
    ForeignKeyViolation = "ForeignKeyViolation",
    NotNullViolation = "NotNullViolation",
    Timeout = "DatabaseTimeout",
    ConnectionError = "DatabaseConnectionError",
    Deadlock = "DatabaseDeadlock",
    Internal = "RepositoryInternal",
}

export enum ServiceErrorKind {
    BadRequest = "ServiceBadRequest",
    Unauthorized = "Unauthorized",
    Forbidden = "Forbidden",
    NotFound = "ServiceNotFound",
    Conflict = "Conflict",
    Unprocessable = "UnprocessableEntity",
    Internal = "ServiceInternal",
}
