import {
    RepositoryErrorKind,
    DatabaseErrorKind,
    ServiceErrorKind,
    CommandErrorKind,
    CommonErrorKind,
    EntityErrorKind,
    GuardErrorKind,
} from "./error-kinds";

declare global {
    namespace Exception {
        type RepositoryErrorKind = keyof typeof RepositoryErrorKind;
        type DatabaseErrorKind = keyof typeof DatabaseErrorKind;
        type CommandErrorKind = keyof typeof CommandErrorKind;
        type ServiceErrorKind = keyof typeof ServiceErrorKind;
        type CommonErrorKind = keyof typeof CommonErrorKind;
        type EntityErrorKind = keyof typeof EntityErrorKind;
        type GuardErrorKind = keyof typeof GuardErrorKind;

        type ResponseBody = {
            /* eslint-disable prettier/prettier */
            error: string;                // Error type/code (e.g., "Bad Request", "Forbidden").
            path?: string;                // Request path.
            statusCode: number;           // HTTP status code.
            timestamp?: string;           // Response creation timestamp in ISO format.
            message: string | string[];   // Human-readable message or list of messages.
            details?: ValidationDetail[]; // Validation details, if any.
            /* eslint-enable prettier/prettier */
        };

        type ValidationDetail = {
            /* eslint-disable prettier/prettier */
            args?: UnknownObject    //
            invalidValue?: unknown; // Field value that triggered the error
            constraint: string;     // Name of the triggered class-validator rule
            message: string;        // Human-readable message provided by class-validator
            path: string;           // Full path to the field
            /* eslint-enable prettier/prettier */
        };
    }
}
