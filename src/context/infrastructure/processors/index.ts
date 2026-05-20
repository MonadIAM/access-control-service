import { Provider } from "@nestjs/common";

import { DLQRetryProcessor } from "./dlq-retry.processor";
import { DLQ_RETRY_PROCESSOR } from "./tokens";

export const PROCESSORS: Provider[] = [
    {
        provide: DLQ_RETRY_PROCESSOR,
        useClass: DLQRetryProcessor,
    },
];

export { DLQ_RETRY_PROCESSOR };
