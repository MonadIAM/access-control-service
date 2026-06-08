import { ClassProvider } from "@nestjs/common";

import { ElevatedAccessCacheService } from "./elevated-access-cache.service";
import { ProjectionCacheService } from "./projection-cache.service";
import { BlacklistCacheService } from "./blacklist-cache.service";
import { ScriptExecutorService } from "./script-executor.service";
import { ScriptLoaderService } from "./script-loader.service";
import {
    ELEVATED_ACCESS_CACHE_SERVICE,
    PROJECTION_CACHE_SERVICE,
    BLACKLIST_CACHE_SERVICE,
    SCRIPT_EXECUTOR_SERVICE,
    SCRIPT_LOADER_SERVICE,
} from "./tokens";

export const INFRASTRUCTURE_SERVICES: ClassProvider[] = [
    {
        provide: ELEVATED_ACCESS_CACHE_SERVICE,
        useClass: ElevatedAccessCacheService,
    },
    {
        provide: PROJECTION_CACHE_SERVICE,
        useClass: ProjectionCacheService,
    },
    {
        provide: BLACKLIST_CACHE_SERVICE,
        useClass: BlacklistCacheService,
    },
    {
        provide: SCRIPT_EXECUTOR_SERVICE,
        useClass: ScriptExecutorService,
    },
    {
        provide: SCRIPT_LOADER_SERVICE,
        useClass: ScriptLoaderService,
    },
];

export {
    ELEVATED_ACCESS_CACHE_SERVICE,
    PROJECTION_CACHE_SERVICE,
    BLACKLIST_CACHE_SERVICE,
    SCRIPT_EXECUTOR_SERVICE,
    SCRIPT_LOADER_SERVICE,
};
