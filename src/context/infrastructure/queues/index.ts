import { ClassProvider } from "@nestjs/common";

import { KafkaRetryProcessor, KafkaRetryQueue } from "./kafka-retry";
import { KAFKA_RETRY_PROCESSOR, KAFKA_RETRY_QUEUE } from "./tokens";

export const QUEUES: ClassProvider[] = [
    {
        provide: KAFKA_RETRY_PROCESSOR,
        useClass: KafkaRetryProcessor,
    },
    {
        provide: KAFKA_RETRY_QUEUE,
        useClass: KafkaRetryQueue,
    },
];

export { KAFKA_RETRY_PROCESSOR, KAFKA_RETRY_QUEUE };
export { BullQueue } from "./enums";
