import { Provider } from "@nestjs/common";

import { RetryProcessor } from "./retry.processor";
import { RETRY_PROCESSOR } from "./tokens";

export const PROCESSORS: Provider[] = [
    {
        provide: RETRY_PROCESSOR,
        useClass: RetryProcessor,
    },
];

export { RETRY_PROCESSOR };
