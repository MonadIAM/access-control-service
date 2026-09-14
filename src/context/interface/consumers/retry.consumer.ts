import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KafkaIncomingMapper, KafkaTopicBuilder, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { KafkaMetricsRecorder } from "~observability/metrics/kafka.recorder";
import { KAFKA_RETRY_QUEUE } from "~context/infrastructure/queues";
import { KafkaTopic } from "~context/enums";

const RETRY_TOPICS = [
    KafkaTopicBuilder.retry(KafkaTopic.PROJECTION_JOURNAL),
    KafkaTopicBuilder.retry(KafkaTopic.REAUTHENTICATION),
    KafkaTopicBuilder.retry(KafkaTopic.MEMBERSHIP),
    KafkaTopicBuilder.retry(KafkaTopic.ACCOUNT),
];

@Controller()
export class RetryConsumer implements Consumers.Retry.Contract {
    private readonly incomingMapper = new KafkaIncomingMapper();
    private readonly logger = new Logger(RetryConsumer.name);

    public constructor(
        @Inject(KafkaMetricsRecorder)
        private readonly kafkaMetrics: Observability.Metrics.Kafka.PublicContract,
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        @Inject(KAFKA_RETRY_QUEUE)
        private readonly kafkaRetryQueue: Queues.KafkaRetry.Contract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    @EventPattern(RETRY_TOPICS)
    public async handle(
        @Payload() message: Consumers.Retry.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Retry.Handle.Result {
        const event = this.incomingMapper.event({ context });
        try {
            await this.process({ event, message, context });
        } catch (error) {
            await this.reject({ event, message, error });
        }
    }

    public async process(props: Consumers.Retry.Process.Props): Consumers.Retry.Process.Result {
        const { event, message, context } = props;
        this.schemaRegistry.validate({ topic: context.getTopic(), value: message });
        await this.kafkaRetryQueue.schedule({ event, message });
    }

    public async reject(props: Consumers.Retry.Reject.Props): Consumers.Retry.Reject.Result {
        const { event, message, error } = props;
        this.logger.warn(`Rejected retry envelope for topic "${message.originalTopic}": ${String(error)}`);
        await lastValueFrom(this.kafkaClient.emit(`${message.originalTopic}-dead`, { key: event, value: message }));
        this.kafkaMetrics.recordDead({ topic: message.originalTopic, error });
    }
}
