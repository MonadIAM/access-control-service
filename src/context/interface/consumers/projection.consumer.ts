import { EventPattern, KafkaContext, KafkaRetriableException, Payload, ClientKafka, Ctx } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";
import { lastValueFrom } from "rxjs";

import { KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE, KafkaIncomingMapper } from "~infrastructure/kafka";
import { KafkaMetricsRecorder } from "~observability/metrics/kafka.recorder";
import { SCRIPT_EXECUTOR_SERVICE } from "~context/infrastructure/services";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

const HEARTBEAT_POLL_INTERVAL = 1e3;

@Controller()
export class ProjectionConsumer implements Consumers.Projection.Contract, OnModuleInit {
    private readonly consumerKey = "access-control.projection.v1";
    private readonly logger = new Logger(ProjectionConsumer.name);
    private readonly incomingMapper = new KafkaIncomingMapper();
    private readonly initialRetryDelay: number;
    private readonly maxRetryDelay: number;

    public constructor(
        @Inject(SCRIPT_EXECUTOR_SERVICE)
        private readonly scriptExecutorService: InfrastructureServices.ScriptExecutor.PublicContract,
        @Inject(KafkaMetricsRecorder)
        private readonly kafkaMetrics: Observability.Metrics.Kafka.PublicContract,
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
        configService: ConfigService,
    ) {
        this.initialRetryDelay = ms(configService.getOrThrow<StringValue>("KAFKA_PROJECTION_RETRY_INITIAL_DELAY"));
        this.maxRetryDelay = ms(configService.getOrThrow<StringValue>("KAFKA_PROJECTION_RETRY_MAX_DELAY"));
    }

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.PROJECTION_JOURNAL)
    public async handle(
        @Payload() message: Consumers.Projection.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Projection.Handle.Result {
        const incoming = this.incomingMapper.map({ consumerKey: this.consumerKey, context });
        try {
            await this.retry({ heartbeat: context.getHeartbeat(), incoming, message, attempt: 0 });
        } catch (error) {
            if (Exception.isRetryable(error)) {
                throw new KafkaRetriableException(error instanceof Error ? error : String(error));
            }

            await this.reject({ incoming, message, error });
        }
    }

    public async process(props: Consumers.Projection.Process.Props): Consumers.Projection.Process.Result {
        const { incoming, message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.PROJECTION_JOURNAL, value: message });
        await this.scriptExecutorService.consume<string>({
            args: [JSON.stringify(message.payload)],
            script: message.actionType,
            event: incoming.event,
        });
    }

    public async reject(props: Consumers.Projection.Reject.Props): Consumers.Projection.Reject.Result {
        const { incoming, message, error } = props;
        this.logger.warn(`Non-retryable error in projection journal consumer: ${String(error)}`);

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

    public async retry(props: Consumers.Projection.Retry.Props): Consumers.Projection.Retry.Result {
        const { heartbeat, incoming, message, attempt } = props;
        try {
            await this.process({ incoming, message });
        } catch (error) {
            if (Exception.isRetryable(error)) {
                const nextAttempt = attempt + 1;
                this.kafkaMetrics.recordRetry({ topic: KafkaTopic.PROJECTION_JOURNAL, error });
                await this.wait({ deadline: Date.now() + this.backoff({ attempt: nextAttempt }), heartbeat });
                await this.retry({ ...props, attempt: nextAttempt });
            } else {
                throw error;
            }
        }
    }

    public async wait(props: Consumers.Projection.Wait.Props): Consumers.Projection.Wait.Result {
        const remaining = props.deadline - Date.now();

        if (remaining > 0) {
            await new Promise((resolve) => setTimeout(resolve, Math.min(HEARTBEAT_POLL_INTERVAL, remaining)));
            await props.heartbeat();
            await this.wait(props);
        }
    }

    public backoff(props: Consumers.Projection.Backoff.Props): Consumers.Projection.Backoff.Result {
        const ceiling = Math.min(this.initialRetryDelay * Math.pow(2, props.attempt - 1), this.maxRetryDelay);
        return Math.random() * ceiling;
    }
}
