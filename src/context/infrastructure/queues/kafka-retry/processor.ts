import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { isObject } from "class-validator";
import { lastValueFrom } from "rxjs";
import { Job } from "bullmq";

import { KAFKA_RETRY_REGISTRY, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { Exception } from "~common/exceptions";

import { BullQueue } from "../enums";

@Injectable()
@Processor(BullQueue.KAFKA_RETRY)
export class KafkaRetryProcessor extends WorkerHost {
    private readonly logger = new Logger(KafkaRetryProcessor.name);

    public constructor(
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        @Inject(KAFKA_RETRY_REGISTRY)
        private readonly retryRegistry: Kafka.RetryRegistry.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {
        super();
    }

    public async process(job: Job<Queues.KafkaRetry.JobData>): Promise<void> {
        const { originalTopic, payload } = job.data;
        const handler = this.retryRegistry.resolve({ topic: originalTopic });

        if (handler) {
            if (isObject(payload)) {
                this.schemaRegistry.validate({ topic: originalTopic, value: payload });
            }

            await handler.process(payload);
        } else {
            throw Exception.invariantViolation({
                messageKey: "kafka-retry.HANDLER_NOT_REGISTERED",
                params: { topic: originalTopic },
            });
        }
    }

    @OnWorkerEvent("failed")
    public async onFailed(job: Job<Queues.KafkaRetry.JobData>): Promise<void> {
        if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
            this.logger.error(
                `Retry exhausted after ${job.attemptsMade} attempts for topic "${job.data.originalTopic}": ${job.data.error}`,
                job.failedReason,
            );

            await lastValueFrom(this.kafkaClient.emit(`${job.data.originalTopic}-dead`, { value: job.data }));
        }
    }
}
