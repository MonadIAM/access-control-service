import { Provider } from "@nestjs/common";

import { PermissionCacheService } from "./permission-cache.service";

export const PERMISSION_CACHE_SERVICE = Symbol("Services.PermissionCache.Contract");

export const INFRASTRUCTURE_SERVICES: Provider[] = [
    {
        provide: PERMISSION_CACHE_SERVICE,
        useClass: PermissionCacheService,
    },
];
