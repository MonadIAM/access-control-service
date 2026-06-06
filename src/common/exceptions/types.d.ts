import { ExceptionFilter as NestExceptionFilter } from "@nestjs/common";
import { FastifyRequest } from "fastify";

import { ErrorKind } from "./enums";

declare global {
    namespace Exception {
        namespace Filter {
            interface PrivateContract {
                metrics: (props: Metrics.Props) => Metrics.Result;
                log: (props: Log.Props) => Log.Result;
            }

            interface Contract extends NestExceptionFilter, PrivateContract {}

            namespace Metrics {
                type Props = {
                    exception: unknown;
                    statusCode: number;
                };

                type Result = void;
            }

            namespace Log {
                type Props = {
                    exception: unknown;
                    request: FastifyRequest;
                    result: Partial<ResponseBody>;
                };

                type Result = void;
            }
        }

        type Headers = {
            "WWW-Authenticate"?: string;
            "Retry-After"?: string | number;
        };

        type Props = {
            statusCode: number;
            messageKey: string;
            kind: ErrorKind;
            cause?: unknown;
            details?: ValidationDetail[];
            params?: UnknownObject;
            headers?: Headers;
        };

        type StatusProps = Pick<Props, "messageKey" | "params" | "headers">;

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
