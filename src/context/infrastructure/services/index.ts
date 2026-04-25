import { Provider } from "@nestjs/common";

import { PermissionCacheService } from "./permission-cache.service";
import { BlacklistCacheService } from "./blacklist-cache.service";

export const PERMISSION_CACHE_SERVICE = Symbol("InfrastructureServices.PermissionCache.Contract");
export const BLACKLIST_CACHE_SERVICE = Symbol("InfrastructureServices.BlacklistCache.Contract");

export const INFRASTRUCTURE_SERVICES: Provider[] = [
    {
        provide: PERMISSION_CACHE_SERVICE,
        useClass: PermissionCacheService,
    },
    {
        provide: BLACKLIST_CACHE_SERVICE,
        useClass: BlacklistCacheService,
    },
];
