import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { SCRIPT_EXECUTOR_SERVICE } from "~context/infrastructure/services/tokens";
import { KafkaUtils, KAFKA_SERVICE } from "~infrastructure/kafka";
import { RetryableException } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

@Controller()
export class ProjectionConsumer implements OnModuleInit {
    private readonly logger = new Logger(ProjectionConsumer.name);

    public constructor(
        @Inject(SCRIPT_EXECUTOR_SERVICE)
        private readonly scriptExecutorService: InfrastructureServices.ScriptExecutor.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.PROJECTION_JOURNAL)
    public async handle(@Payload() message: Consumers.Projection.Payload, @Ctx() context: KafkaContext): Promise<void> {
        try {
            await this.scriptExecutorService.execute<string>(message.operationType, [message.payload]);
        } catch (error) {
            if (RetryableException.is(error)) {
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.PROJECTION_JOURNAL_RETRY, {
                        headers: { "x-retry-count": String(KafkaUtils.extractRetryCount(context)) },
                        value: {
                            originalTopic: KafkaTopic.PROJECTION_JOURNAL,
                            payload: message,
                            error: String(error),
                        },
                    }),
                );
            } else {
                this.logger.warn(`Non-retryable error in projection consumer: ${String(error)}`);
            }
        }
    }
}
