import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KafkaTopicBuilder, KAFKA_RETRY_REGISTRY, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { SCRIPT_EXECUTOR_SERVICE } from "~context/infrastructure/services";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

@Controller()
export class ProjectionConsumer implements Consumers.Projection.Contract, OnModuleInit {
    private readonly logger = new Logger(ProjectionConsumer.name);

    public constructor(
        @Inject(SCRIPT_EXECUTOR_SERVICE)
        private readonly scriptExecutorService: InfrastructureServices.ScriptExecutor.PublicContract,
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        @Inject(KAFKA_RETRY_REGISTRY)
        private readonly retryRegistry: Kafka.RetryRegistry.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();

        this.retryRegistry.register({
            topic: KafkaTopic.PROJECTION_JOURNAL,
            handler: this,
        });
    }

    @EventPattern(KafkaTopic.PROJECTION_JOURNAL)
    public async handle(@Payload() message: Consumers.Projection.Message): Consumers.Projection.Handle.Result {
        try {
            await this.process({ message });
        } catch (error) {
            await this.reject({ message, error });
        }
    }

    public async process(props: Consumers.Projection.Process.Props): Consumers.Projection.Process.Result {
        const { message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.PROJECTION_JOURNAL, value: message });
        await this.scriptExecutorService.execute<string>({
            args: [JSON.stringify(message.payload)],
            script: message.actionType,
        });
    }

    public async reject(props: Consumers.Projection.Reject.Props): Consumers.Projection.Reject.Result {
        const { message, error } = props;
        const retryable = Exception.isRetryable(error);

        if (!retryable) {
            this.logger.warn(`Non-retryable error in projection journal consumer: ${String(error)}`);
        }

        await lastValueFrom(
            this.kafkaClient.emit(
                retryable ? KafkaTopicBuilder.retry(KafkaTopic.PROJECTION_JOURNAL) : KafkaTopic.PROJECTION_JOURNAL_DEAD,
                {
                    value: {
                        originalTopic: KafkaTopic.PROJECTION_JOURNAL,
                        error: String(error),
                        payload: message,
                    },
                },
            ),
        );
    }
}
