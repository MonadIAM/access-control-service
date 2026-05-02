import { Provider } from "@nestjs/common";

import { PermissionCacheInvalidationProcessor } from "./permission-invalidation.processor";
import { DLQRetryProcessor } from "./dlq-retry.processor";

export const PERMISSION_CACHE_INVALIDATION_PROCESSOR = Symbol("Processors.PermissionCacheInvalidation");
export const DLQ_RETRY_PROCESSOR = Symbol("Processors.DLQRetry");

export const PROCESSORS: Provider[] = [
    {
        provide: PERMISSION_CACHE_INVALIDATION_PROCESSOR,
        useClass: PermissionCacheInvalidationProcessor,
    },
    {
        provide: DLQ_RETRY_PROCESSOR,
        useClass: DLQRetryProcessor,
    },
];
