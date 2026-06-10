import { ClassProvider } from "@nestjs/common";

import { ReauthenticationCacheService } from "./reauthentication-cache.service";
import { ProjectionCacheService } from "./projection-cache.service";
import { BlacklistCacheService } from "./blacklist-cache.service";
import { ScriptExecutorService } from "./script-executor.service";
import { ScriptLoaderService } from "./script-loader.service";
import {
    REAUTHENTICATION_CACHE_SERVICE,
    PROJECTION_CACHE_SERVICE,
    BLACKLIST_CACHE_SERVICE,
    SCRIPT_EXECUTOR_SERVICE,
    SCRIPT_LOADER_SERVICE,
} from "./tokens";

export const INFRASTRUCTURE_SERVICES: ClassProvider[] = [
    {
        provide: REAUTHENTICATION_CACHE_SERVICE,
        useClass: ReauthenticationCacheService,
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
    REAUTHENTICATION_CACHE_SERVICE,
    PROJECTION_CACHE_SERVICE,
    BLACKLIST_CACHE_SERVICE,
    SCRIPT_EXECUTOR_SERVICE,
    SCRIPT_LOADER_SERVICE,
};
