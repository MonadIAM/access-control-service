import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { lastValueFrom } from "rxjs";
import { Queue } from "bullmq";

import { KafkaUtils, KAFKA_SERVICE } from "~infrastructure/kafka";
import { KafkaTopic } from "~context/enums";

const RETRY_TOPICS = [KafkaTopic.ACCOUNT_RETRY, KafkaTopic.PROJECTION_JOURNAL_RETRY];

const DEAD_TOPIC_MAP: Partial<Record<string, string>> = {
    [KafkaTopic.PROJECTION_JOURNAL]: KafkaTopic.PROJECTION_JOURNAL_DEAD,
    [KafkaTopic.ACCOUNT]: KafkaTopic.ACCOUNT_DEAD,
};

@Controller()
export class RetryConsumer implements OnModuleInit {
    private readonly maxRetries: number;
    private readonly baseDelay: number;
    private readonly jitter: number;

    public constructor(
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
        @InjectQueue("kafka-retry")
        private readonly retryQueue: Queue<Consumers.DLQ.Message & { retryCount: number }>,
        private readonly configService: ConfigService,
    ) {
        this.baseDelay = this.configService.getOrThrow<number>("KAFKA_DLQ_RETRY_BASE_DELAY");
        this.maxRetries = this.configService.getOrThrow<number>("KAFKA_DLQ_MAX_RETRIES");
        this.jitter = this.configService.getOrThrow<number>("KAFKA_DLQ_RETRY_JITTER");
    }

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(RETRY_TOPICS)
    public async handle(@Payload() message: Consumers.DLQ.Message, @Ctx() context: KafkaContext): Promise<void> {
        const retryCount = KafkaUtils.extractRetryCount(context);

        if (retryCount >= this.maxRetries) {
            await this.moveToDeadLetter(message);
        } else {
            await this.scheduleRetry(message, retryCount);
        }
    }

    private async moveToDeadLetter(message: Consumers.DLQ.Message): Promise<void> {
        const deadTopic = DEAD_TOPIC_MAP[message.originalTopic];
        if (deadTopic) {
            await lastValueFrom(this.kafkaClient.emit(deadTopic, message));
        }
    }

    private async scheduleRetry(message: Consumers.DLQ.Message, retryCount: number): Promise<void> {
        await this.retryQueue.add(
            "retry",
            { ...message, retryCount },
            {
                delay: this.baseDelay + Math.random() * this.jitter,
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: this.baseDelay,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        );
    }
}
