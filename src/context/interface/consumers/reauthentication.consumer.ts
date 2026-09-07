import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KafkaTopicBuilder, KAFKA_RETRY_REGISTRY, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { REAUTHENTICATION_CACHE_SERVICE } from "~context/infrastructure/services";
import { KafkaMetricsRecorder } from "~observability/metrics/kafka.recorder";
import { KafkaTopic } from "~context/enums";

@Controller()
export class ReauthenticationConsumer implements Consumers.Reauthentication.Contract, OnModuleInit {
    public constructor(
        @Inject(REAUTHENTICATION_CACHE_SERVICE)
        private readonly reauthenticationCacheService: InfrastructureServices.ReauthenticationCache.PublicContract,
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
            topic: KafkaTopic.REAUTHENTICATION,
            handler: this,
        });
    }

    @EventPattern(KafkaTopic.REAUTHENTICATION)
    public async handle(@Payload() message: Consumers.Reauthentication.Message): Consumers.Reauthentication.Handle.Result {
        try {
            this.schemaRegistry.validate({ topic: KafkaTopic.REAUTHENTICATION, value: message });
            await this.process({ message });
        } catch (error) {
            await this.reject({ message, error });
        }
    }

    public async process(props: Consumers.Reauthentication.Process.Props): Consumers.Reauthentication.Process.Result {
        const { message } = props;
        const ttl = Math.floor((message.payload.expiresAt - Date.now()) / 1e3);
        if (ttl > 0) {
            await this.reauthenticationCacheService.set({ session: message.payload.session, ttl });
        }
    }

    public async reject(props: Consumers.Reauthentication.Reject.Props): Consumers.Reauthentication.Reject.Result {
        const { message, error } = props;
        await lastValueFrom(
            this.kafkaClient.emit(KafkaTopicBuilder.retry(KafkaTopic.REAUTHENTICATION), {
                value: {
                    originalTopic: KafkaTopic.REAUTHENTICATION,
                    error: String(error),
                    payload: message,
                },
            }),
        );
        this.kafkaMetrics.recordRetry({ topic: KafkaTopic.REAUTHENTICATION, error });
    }
}
