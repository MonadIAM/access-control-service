import { ClassProvider } from "@nestjs/common";

import { KAFKA_RETRY_PROCESSOR, CLEANUP_PROCESSOR, KAFKA_RETRY_QUEUE, CLEANUP_QUEUE } from "./tokens";
import { KafkaRetryProcessor, KafkaRetryQueue } from "./kafka-retry";
import { CleanupProcessor, CleanupQueue } from "./cleanup";

export const QUEUES: ClassProvider[] = [
    {
        provide: KAFKA_RETRY_PROCESSOR,
        useClass: KafkaRetryProcessor,
    },
    {
        provide: CLEANUP_PROCESSOR,
        useClass: CleanupProcessor,
    },
    {
        provide: KAFKA_RETRY_QUEUE,
        useClass: KafkaRetryQueue,
    },
    {
        provide: CLEANUP_QUEUE,
        useClass: CleanupQueue,
    },
];

export { KAFKA_RETRY_PROCESSOR, CLEANUP_PROCESSOR, KAFKA_RETRY_QUEUE, CLEANUP_QUEUE };
export { BullQueue } from "./enums";
