import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KafkaTopicBuilder, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
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
    private readonly logger = new Logger(RetryConsumer.name);

    public constructor(
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
        try {
            await this.process({ message, context });
        } catch (error) {
            await this.reject({ message, error });
        }
    }

    public async process(props: Consumers.Retry.Process.Props): Consumers.Retry.Process.Result {
        const { message, context } = props;
        this.schemaRegistry.validate({ topic: context.getTopic(), value: message });
        await this.kafkaRetryQueue.schedule({ message });
    }

    public async reject(props: Consumers.Retry.Reject.Props): Consumers.Retry.Reject.Result {
        const { message, error } = props;
        this.logger.warn(`Rejected retry envelope for topic "${message.originalTopic}": ${String(error)}`);
        await lastValueFrom(this.kafkaClient.emit(`${message.originalTopic}-dead`, { value: message }));
    }
}
