export enum RepositoryErrorKind {
    // 1. Ошибки бизнес-логики БД
    BadRequest = "RepositoryBadRequest",
    NotFound = "RepositoryNotFound",
    UniqueViolation = "UniqueViolation",
    ForeignKeyViolation = "ForeignKeyViolation",
    NotNullViolation = "NotNullViolation",
    // 2. Инфраструктурные ошибки (DriverException)
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
