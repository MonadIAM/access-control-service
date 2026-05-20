import { Provider } from "@nestjs/common";

import { PermissionCacheInvalidationQueue } from "./permission-invalidation.queue";
import { PERMISSION_CACHE_INVALIDATION_QUEUE } from "./tokens";

export const QUEUES: Provider[] = [
    {
        provide: PERMISSION_CACHE_INVALIDATION_QUEUE,
        useClass: PermissionCacheInvalidationQueue,
    },
];

export { PERMISSION_CACHE_INVALIDATION_QUEUE };
