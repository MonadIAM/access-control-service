import { Provider } from "@nestjs/common";

import { KafkaRetryProcessor, KafkaRetryQueue } from "./kafka-retry";
import { KAFKA_RETRY_QUEUE } from "./tokens";

export const QUEUES: Provider[] = [
    KafkaRetryProcessor,
    {
        provide: KAFKA_RETRY_QUEUE,
        useClass: KafkaRetryQueue,
    },
];

export { BullQueue } from "./enums";
export { KAFKA_RETRY_QUEUE };
