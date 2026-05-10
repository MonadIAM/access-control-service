import { Provider } from "@nestjs/common";

import { DLQRetryProcessor } from "./dlq-retry.processor";

export const DLQ_RETRY_PROCESSOR = Symbol("Processors.DLQRetry");

export const PROCESSORS: Provider[] = [
    {
        provide: DLQ_RETRY_PROCESSOR,
        useClass: DLQRetryProcessor,
    },
];
