import { EventPattern, Payload } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { Controller } from "@nestjs/common";
import { Queue } from "bullmq";

import { KafkaTopic } from "~context/enums";

@Controller()
export class AccountDLQConsumer {
    private readonly maxRetries: number;
    private readonly baseDelay: number;
    private readonly maxDelay: number;
    private readonly jitter: number;

    public constructor(
        @InjectQueue("dlq-retry")
        private readonly dlqRetryQueue: Queue,
        private readonly configService: ConfigService,
    ) {
        this.maxRetries = this.configService.getOrThrow<number>("KAFKA_DLQ_MAX_RETRIES");
        this.baseDelay = this.configService.getOrThrow<number>("KAFKA_DLQ_RETRY_BASE_DELAY");
        this.maxDelay = this.configService.getOrThrow<number>("KAFKA_DLQ_RETRY_MAX_DELAY");
        this.jitter = this.configService.getOrThrow<number>("KAFKA_DLQ_RETRY_JITTER");
    }

    @EventPattern(KafkaTopic.ACCOUNT_DLQ)
    public async handle(@Payload() message: Consumers.DLQ.Message): Promise<void> {
        if (message.retryCount >= this.maxRetries) {
            return;
        }

        await this.dlqRetryQueue.add("retry", message, {
            delay: this.calculateDelay(message.retryCount),
            removeOnComplete: true,
            removeOnFail: true,
        });
    }

    private calculateDelay(retryCount: number): number {
        const jitter = Math.random() * this.jitter;
        return Math.min(this.baseDelay * Math.pow(2, retryCount) + jitter, this.maxDelay);
    }
}
