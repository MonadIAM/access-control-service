import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import ms, { StringValue } from "ms";
import { Queue } from "bullmq";

import { BullJobName, BullQueue } from "../enums";

@Injectable()
export class KafkaRetryQueue implements Queues.KafkaRetry.Contract {
    private readonly maxRetries: number;
    private readonly baseDelay: number;
    private readonly jitter: number;

    public constructor(
        @InjectQueue(BullQueue.KAFKA_RETRY)
        private readonly queue: Queue<Queues.KafkaRetry.JobData>,
        private readonly configService: ConfigService,
    ) {
        this.baseDelay = ms(this.configService.getOrThrow<StringValue>("KAFKA_DLQ_RETRY_BASE_DELAY"));
        this.jitter = ms(this.configService.getOrThrow<StringValue>("KAFKA_DLQ_RETRY_JITTER"));
        this.maxRetries = this.configService.getOrThrow<number>("KAFKA_DLQ_MAX_RETRIES");
    }

    public async schedule(props: Queues.KafkaRetry.Schedule.Props): Queues.KafkaRetry.Schedule.Result {
        const { event, message } = props;
        const data = { ...message, event };

        await this.queue.add(BullJobName.RETRY, data, {
            delay: this.baseDelay + Math.random() * this.jitter,
            jobId: `${message.originalTopic}-${event}`,
            attempts: this.maxRetries,
            removeOnComplete: true,
            removeOnFail: false,
            backoff: {
                delay: this.baseDelay,
                type: "exponential",
            },
        });
    }
}
