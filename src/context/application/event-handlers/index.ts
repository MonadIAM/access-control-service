import { Provider } from "@nestjs/common";

import { PermissionCacheDirectInvalidationHandler } from "./permission-cache-direct-invalidation.handler";
import { PermissionCacheQueueInvalidationHandler } from "./permission-cache-queue-invalidation.handler";

export const EVENT_HANDLERS: Provider[] = [
    PermissionCacheDirectInvalidationHandler,
    PermissionCacheQueueInvalidationHandler,
];
