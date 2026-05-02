import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { Job } from "bullmq";

import { KAFKA_SERVICE } from "~infrastructure/kafka";

@Injectable()
@Processor("dlq-retry")
export class DLQRetryProcessor extends WorkerHost {
    public constructor(
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {
        super();
    }

    public async process(job: Job<Consumers.DLQ.Message>): Promise<void> {
        const { originalTopic, payload, retryCount, error, timestamp } = job.data;

        await lastValueFrom(
            this.kafkaClient.emit(originalTopic, {
                retryCount: retryCount + 1,
                originalTopic,
                timestamp,
                payload,
                error,
            }),
        );
    }
}
