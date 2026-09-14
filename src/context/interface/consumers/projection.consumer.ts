import { EventPattern, KafkaContext, Payload, ClientKafka, Ctx } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KafkaMetricsRecorder } from "~observability/metrics/kafka.recorder";
import { SCRIPT_EXECUTOR_SERVICE } from "~context/infrastructure/services";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";
import {
    KAFKA_SCHEMA_REGISTRY,
    KAFKA_RETRY_REGISTRY,
    KafkaIncomingMapper,
    KafkaTopicBuilder,
    KAFKA_SERVICE,
} from "~infrastructure/kafka";

@Controller()
export class ProjectionConsumer implements Consumers.Projection.Contract, OnModuleInit {
    private readonly logger = new Logger(ProjectionConsumer.name);
    private readonly incomingMapper = new KafkaIncomingMapper();
    private readonly consumerKey = "access-control.projection.v1";

    public constructor(
        @Inject(SCRIPT_EXECUTOR_SERVICE)
        private readonly scriptExecutorService: InfrastructureServices.ScriptExecutor.PublicContract,
        @Inject(KafkaMetricsRecorder)
        private readonly kafkaMetrics: Observability.Metrics.Kafka.PublicContract,
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
            consumerKey: this.consumerKey,
            topic: KafkaTopic.PROJECTION_JOURNAL,
            handler: this,
        });
    }

    @EventPattern(KafkaTopic.PROJECTION_JOURNAL)
    public async handle(
        @Payload() message: Consumers.Projection.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Projection.Handle.Result {
        const incoming = this.incomingMapper.map({ consumerKey: this.consumerKey, context });
        try {
            await this.process({ incoming, message });
        } catch (error) {
            await this.reject({ incoming, message, error });
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
        const { incoming, message, error } = props;
        const retryable = Exception.isRetryable(error);

        if (!retryable) {
            this.logger.warn(`Non-retryable error in projection journal consumer: ${String(error)}`);
        }

        await lastValueFrom(
            this.kafkaClient.emit(
                retryable ? KafkaTopicBuilder.retry(KafkaTopic.PROJECTION_JOURNAL) : KafkaTopic.PROJECTION_JOURNAL_DEAD,
                {
                    key: incoming.event,
                    value: {
                        originalTopic: KafkaTopic.PROJECTION_JOURNAL,
                        error: String(error),
                        payload: message,
                    },
                },
            ),
        );

        if (retryable) {
            this.kafkaMetrics.recordRetry({ topic: KafkaTopic.PROJECTION_JOURNAL, error });
        } else {
            this.kafkaMetrics.recordDead({ topic: KafkaTopic.PROJECTION_JOURNAL, error });
        }
    }
}
