import { Provider } from "@nestjs/common";

import { CLEANUP_PROCESSOR, CLEANUP_QUEUE } from "./tokens";
import { CleanupProcessor, CleanupQueue } from "./cleanup";
import { BULLMQ_JOBS_PROVIDER } from "./metrics.provider";

export const QUEUES: Provider[] = [
    BULLMQ_JOBS_PROVIDER,
    {
        provide: CLEANUP_PROCESSOR,
        useClass: CleanupProcessor,
    },
    {
        provide: CLEANUP_QUEUE,
        useClass: CleanupQueue,
    },
];

export { CLEANUP_PROCESSOR, CLEANUP_QUEUE };
export { BullQueue } from "./enums";
