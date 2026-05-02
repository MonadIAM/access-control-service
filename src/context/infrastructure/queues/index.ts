import { Provider } from "@nestjs/common";

import { PermissionCacheInvalidationQueue } from "./permission-invalidation.queue";

export const PERMISSION_CACHE_INVALIDATION_QUEUE = Symbol("Queues.PermissionInvalidation.Contract");

export const QUEUES: Provider[] = [
    {
        provide: PERMISSION_CACHE_INVALIDATION_QUEUE,
        useClass: PermissionCacheInvalidationQueue,
    },
];
