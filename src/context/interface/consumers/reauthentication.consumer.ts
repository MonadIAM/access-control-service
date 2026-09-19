import { EventPattern, KafkaContext, Payload, ClientKafka, Ctx } from "@nestjs/microservices";
import { Controller, Inject, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KAFKA_RETRY_SERVICE, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE, KafkaIncomingMapper } from "~infrastructure/kafka";
import { REAUTHENTICATION_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { KAFKA_METRICS_RECORDER } from "~observability/metrics/tokens";
import { KafkaTopic } from "~context/enums";

@Controller()
export class ReauthenticationConsumer implements Consumers.Reauthentication.Contract, OnModuleInit {
    private readonly incomingMapper: Kafka.IncomingMapper.Contract = new KafkaIncomingMapper();
    private readonly consumerKey = "access-control.reauthentication.v1";

    public constructor(
        @Inject(REAUTHENTICATION_CACHE_SERVICE)
        private readonly reauthenticationCacheService: InfrastructureServices.ReauthenticationCache.PublicContract,
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

    @EventPattern(KafkaTopic.REAUTHENTICATION)
    public async handle(
        @Payload() message: Consumers.Reauthentication.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Reauthentication.Handle.Result {
        const incoming = {
            consumerKey: this.consumerKey,
            event: this.incomingMapper.reference({ context }),
        };
        await this.kafkaRetry.execute({
            topic: KafkaTopic.REAUTHENTICATION,
            heartbeat: context.getHeartbeat(),
            process: () =>
                this.process({
                    incoming: this.incomingMapper.map({ consumerKey: this.consumerKey, context }),
                    message,
                }),
            reject: (error) => this.reject({ incoming, message, error }),
        });
    }

    public async process(props: Consumers.Reauthentication.Process.Props): Consumers.Reauthentication.Process.Result {
        const message = await this.schemaRegistry.decode<Consumers.Reauthentication.Message>({
            topic: KafkaTopic.REAUTHENTICATION,
            value: props.message,
        });
        this.schemaRegistry.validate({ topic: KafkaTopic.REAUTHENTICATION, value: message });
        const ttl = Math.floor((message.payload.expiresAt - Date.now()) / 1e3);
        if (ttl > 0) {
            await this.reauthenticationCacheService.set({ session: message.payload.session, ttl });
        }
    }

    public async reject(props: Consumers.Reauthentication.Reject.Props): Consumers.Reauthentication.Reject.Result {
        const { incoming, message, error } = props;
        await lastValueFrom(
            this.kafkaClient.emit(KafkaTopic.REAUTHENTICATION_DEAD, {
                key: incoming.event,
                value: {
                    originalTopic: KafkaTopic.REAUTHENTICATION,
                    error: String(error),
                    payload: message,
                },
            }),
        );

        this.kafkaMetrics.recordDead({ topic: KafkaTopic.REAUTHENTICATION, error });
    }
}
