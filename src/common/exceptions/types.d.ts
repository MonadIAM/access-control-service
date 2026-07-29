import { ExceptionFilter as NestExceptionFilter } from "@nestjs/common";
import { FastifyRequest } from "fastify";

import { ErrorCode, ErrorKind } from "./enums";

declare global {
    namespace Exception {
        namespace Filter {
            interface InternalContract {
                metrics(props: Metrics.Props): Metrics.Result;
                log(props: Log.Props): Log.Result;
            }

            interface Contract extends NestExceptionFilter, InternalContract {}

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

        type Headers = Record<string, string | number>;

        type Props = {
            statusCode: number;
            messageKey: string;
            kind: ErrorKind;
            code: ErrorCode;
            cause?: unknown;
            details?: ValidationDetail[];
            params?: UnknownObject;
            headers?: Headers;
        };

        type StatusProps = Pick<Props, "messageKey" | "params" | "headers"> & Partial<Pick<Props, "code">>;

        type ResponseBody = {
            /* eslint-disable prettier/prettier */
            error: string;                // Error kind.
            code: string;                 // Public error code.
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
