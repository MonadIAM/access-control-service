import { Provider } from "@nestjs/common";

import { BLACKLIST_CACHE_SERVICE, SCRIPT_EXECUTOR_SERVICE, SCRIPT_LOADER_SERVICE } from "./tokens";
import { BlacklistCacheService } from "./blacklist-cache.service";
import { ScriptExecutorService } from "./script-executor.service";
import { ScriptLoaderService } from "./script-loader.service";

export const INFRASTRUCTURE_SERVICES: Provider[] = [
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
