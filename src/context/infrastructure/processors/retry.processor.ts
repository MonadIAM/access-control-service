import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { Job } from "bullmq";

import { KAFKA_SERVICE } from "~infrastructure/kafka";

type RetryJobData = Consumers.DLQ.Message & { retryCount: number };

@Injectable()
@Processor("kafka-retry")
export class RetryProcessor extends WorkerHost {
    private readonly logger = new Logger(RetryProcessor.name);

    public constructor(
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {
        super();
    }

    public async process(job: Job<RetryJobData>): Promise<void> {
        const { originalTopic, payload, retryCount } = job.data;

        await lastValueFrom(
            this.kafkaClient.emit(originalTopic, {
                value: payload,
                headers: { "x-retry-count": String(retryCount + 1) },
            }),
        );
    }

    @OnWorkerEvent("failed")
    public onFailed(job: Job<RetryJobData>): void {
        this.logger.error(
            `Retry exhausted after ${job.attemptsMade} attempts for topic "${job.data.originalTopic}": ${job.data.error}`,
            job.failedReason,
        );
    }
}
