import { ValueProvider } from "@nestjs/common";

import { COMMANDS } from "~context/application/commands";
import { QUERIES } from "~context/application/queries";

const IGNORED_KEYS: Set<string | symbol> = new Set([
    "beforeApplicationShutdown",
    "onApplicationShutdown",
    "onModuleDestroy",
    "then",
]);

const stub = new Proxy({}, { get: (_, property) => (IGNORED_KEYS.has(property) ? null : () => null) });

export const SWAGGER_STUB_PROVIDERS: ValueProvider[] = COMMANDS.concat(QUERIES)
    .map(({ provide }) => ({
        useValue: stub,
        provide,
    }))
    .concat(
        {
            provide: "PROM_METRIC_HTTP_REQUEST_DURATION_SECONDS",
            useValue: stub,
        },
        {
            provide: "PROM_METRIC_HTTP_REQUESTS_TOTAL",
            useValue: stub,
        },
    );
