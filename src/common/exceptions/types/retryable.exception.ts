import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

const RETRYABLE_STATUSES = new Set<number>([
    HttpStatus.INTERNAL_SERVER_ERROR,
    HttpStatus.SERVICE_UNAVAILABLE,
    HttpStatus.GATEWAY_TIMEOUT,
    HttpStatus.REQUEST_TIMEOUT,
    HttpStatus.BAD_GATEWAY,
]);

export class RetryableException {
    private constructor() {}

    public static is(error: unknown): boolean {
        if (error instanceof BaseException) {
            return RETRYABLE_STATUSES.has(error.statusCode);
        } else {
            return false;
        }
    }
}
