import { Provider } from "@nestjs/common";

import { PermissionCacheInvalidationProcessor } from "./permission-invalidation.processor";
import { PermissionCacheInvalidationQueue } from "./permission-invalidation.queue";

export const PROCESSORS: Provider[] = [PermissionCacheInvalidationProcessor];

export const PERMISSION_CACHE_INVALIDATION_QUEUE = Symbol("Queues.PermissionInvalidation.Contract");

export const QUEUES: Provider[] = [
    {
        provide: PERMISSION_CACHE_INVALIDATION_QUEUE,
        useClass: PermissionCacheInvalidationQueue,
    },
];
