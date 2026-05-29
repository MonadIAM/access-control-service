import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { Job } from "bullmq";

import { KAFKA_SERVICE } from "~infrastructure/kafka";

import { BullQueue } from "../enums";

@Injectable()
@Processor(BullQueue.KAFKA_RETRY)
export class KafkaRetryProcessor extends WorkerHost {
    private readonly logger = new Logger(KafkaRetryProcessor.name);

    public constructor(
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {
        super();
    }

    public async process(job: Job<Queues.KafkaRetry.JobData>): Promise<void> {
        const { originalTopic, payload, retryCount } = job.data;

        await lastValueFrom(
            this.kafkaClient.emit(originalTopic, {
                value: payload,
                headers: {
                    "x-retry-count": String(retryCount + 1),
                },
            }),
        );
    }

    @OnWorkerEvent("failed")
    public onFailed(job: Job<Queues.KafkaRetry.JobData>): void {
        this.logger.error(
            `Retry exhausted after ${job.attemptsMade} attempts for topic "${job.data.originalTopic}": ${job.data.error}`,
            job.failedReason,
        );
    }
}
