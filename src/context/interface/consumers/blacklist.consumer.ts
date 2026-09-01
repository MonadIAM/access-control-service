import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { BLACKLIST_CACHE_SERVICE } from "~context/infrastructure/services";
import { KafkaTopic } from "~context/enums";

@Controller()
export class BlacklistConsumer implements Consumers.Blacklist.Contract, OnModuleInit {
    private readonly logger = new Logger(BlacklistConsumer.name);

    public constructor(
        @Inject(BLACKLIST_CACHE_SERVICE)
        private readonly blacklistCacheService: InfrastructureServices.BlacklistCache.PublicContract,
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    @EventPattern(KafkaTopic.BLACKLIST)
    public async handle(@Payload() message: Consumers.Blacklist.Message): Consumers.Blacklist.Handle.Result {
        try {
            await this.process({ message });
        } catch (error) {
            await this.reject({ message, error });
        }
    }

    public async process(props: Consumers.Blacklist.Process.Prosp): Consumers.Blacklist.Process.Result {
        const { message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.BLACKLIST, value: message });
        const ttl = Math.floor((message.payload.expiresAt - Date.now()) / 1e3);
        if (ttl > 0) {
            await this.blacklistCacheService.set({ session: message.payload.session, ttl });
        }
    }

    public async reject(props: Consumers.Blacklist.Reject.Props): Consumers.Blacklist.Reject.Result {
        const { message, error } = props;
        this.logger.warn(`Non-retryable error in blacklist consumer: ${String(error)}`);

        await lastValueFrom(
            this.kafkaClient.emit(KafkaTopic.BLACKLIST_DEAD, {
                value: {
                    originalTopic: KafkaTopic.BLACKLIST,
                    error: String(error),
                    payload: message,
                },
            }),
        );
    }
}
