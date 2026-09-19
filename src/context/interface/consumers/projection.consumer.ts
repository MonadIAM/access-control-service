import { EventPattern, KafkaContext, Payload, ClientKafka, Ctx } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KAFKA_RETRY_SERVICE, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE, KafkaIncomingMapper } from "~infrastructure/kafka";
import { SCRIPT_EXECUTOR_SERVICE } from "~context/infrastructure/services/tokens";
import { KAFKA_METRICS_RECORDER } from "~observability/metrics/tokens";
import { KafkaTopic } from "~context/enums";

@Controller()
export class ProjectionConsumer implements Consumers.Projection.Contract, OnModuleInit {
    private readonly consumerKey = "access-control.projection.v1";
    private readonly logger = new Logger(ProjectionConsumer.name);
    private readonly incomingMapper = new KafkaIncomingMapper();

    public constructor(
        @Inject(SCRIPT_EXECUTOR_SERVICE)
        private readonly scriptExecutorService: InfrastructureServices.ScriptExecutor.PublicContract,
        @Inject(KAFKA_METRICS_RECORDER)
        private readonly kafkaMetrics: Observability.Metrics.Kafka.PublicContract,
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        @Inject(KAFKA_RETRY_SERVICE)
        private readonly kafkaRetry: Kafka.Retry.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.PROJECTION_JOURNAL)
    public async handle(
        @Payload() message: Consumers.Projection.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Projection.Handle.Result {
        const incoming = {
            consumerKey: this.consumerKey,
            event: this.incomingMapper.reference({ context }),
        };
        await this.kafkaRetry.execute({
            topic: KafkaTopic.PROJECTION_JOURNAL,
            heartbeat: context.getHeartbeat(),
            process: () =>
                this.process({
                    incoming: this.incomingMapper.map({ consumerKey: this.consumerKey, context }),
                    message,
                }),
            reject: (error) => this.reject({ incoming, message, error }),
        });
    }

    public async process(props: Consumers.Projection.Process.Props): Consumers.Projection.Process.Result {
        const { incoming } = props;
        const message = await this.schemaRegistry.decode<Consumers.Projection.Message>({
            topic: KafkaTopic.PROJECTION_JOURNAL,
            value: props.message,
        });
        this.schemaRegistry.validate({ topic: KafkaTopic.PROJECTION_JOURNAL, value: message });
        await this.scriptExecutorService.consume<string>({
            args: [JSON.stringify(message.payload)],
            script: message.actionType,
            event: incoming.event,
        });
    }

    public async reject(props: Consumers.Projection.Reject.Props): Consumers.Projection.Reject.Result {
        const { incoming, message, error } = props;
        this.logger.warn(`Rejected message in projection journal consumer: ${String(error)}`);

        await lastValueFrom(
            this.kafkaClient.emit(KafkaTopic.PROJECTION_JOURNAL_DEAD, {
                key: incoming.event,
                value: {
                    originalTopic: KafkaTopic.PROJECTION_JOURNAL,
                    error: String(error),
                    payload: message,
                },
            }),
        );

        this.kafkaMetrics.recordDead({ topic: KafkaTopic.PROJECTION_JOURNAL, error });
    }
}
