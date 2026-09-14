import { EventPattern, KafkaContext, Payload, ClientKafka, Ctx } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KafkaIncomingMapper, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { KafkaMetricsRecorder } from "~observability/metrics/kafka.recorder";
import { BLACKLIST_CACHE_SERVICE } from "~context/infrastructure/services";
import { KafkaTopic } from "~context/enums";

@Controller()
export class BlacklistConsumer implements Consumers.Blacklist.Contract, OnModuleInit {
    private readonly incomingMapper = new KafkaIncomingMapper();
    private readonly logger = new Logger(BlacklistConsumer.name);
    private readonly consumerKey = "access-control.blacklist.v1";

    public constructor(
        @Inject(BLACKLIST_CACHE_SERVICE)
        private readonly blacklistCacheService: InfrastructureServices.BlacklistCache.PublicContract,
        @Inject(KafkaMetricsRecorder)
        private readonly kafkaMetrics: Observability.Metrics.Kafka.PublicContract,
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.BLACKLIST)
    public async handle(
        @Payload() message: Consumers.Blacklist.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Blacklist.Handle.Result {
        const incoming = this.incomingMapper.map({ consumerKey: this.consumerKey, context });
        try {
            await this.process({ incoming, message });
        } catch (error) {
            await this.reject({ incoming, message, error });
        }
    }

    public async process(props: Consumers.Blacklist.Process.Props): Consumers.Blacklist.Process.Result {
        const { message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.BLACKLIST, value: message });
        const ttl = Math.floor((message.payload.expiresAt - Date.now()) / 1e3);
        if (ttl > 0) {
            await this.blacklistCacheService.set({ session: message.payload.session, ttl });
        }
    }

    public async reject(props: Consumers.Blacklist.Reject.Props): Consumers.Blacklist.Reject.Result {
        const { incoming, message, error } = props;
        this.logger.warn(`Non-retryable error in blacklist consumer: ${String(error)}`);

        await lastValueFrom(
            this.kafkaClient.emit(KafkaTopic.BLACKLIST_DEAD, {
                key: incoming.event,
                value: {
                    originalTopic: KafkaTopic.BLACKLIST,
                    error: String(error),
                    payload: message,
                },
            }),
        );
        this.kafkaMetrics.recordDead({ topic: KafkaTopic.BLACKLIST, error });
    }
}
