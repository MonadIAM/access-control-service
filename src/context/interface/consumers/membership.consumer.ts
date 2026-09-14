import { EventPattern, KafkaContext, Payload, ClientKafka, Ctx } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { MembershipTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KafkaMetricsRecorder } from "~observability/metrics/kafka.recorder";
import { MEMBERSHIP_COMMANDS } from "~context/application/commands";
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
export class MembershipConsumer implements Consumers.Membership.Contract, OnModuleInit {
    private readonly logger = new Logger(MembershipConsumer.name);
    private readonly incomingMapper = new KafkaIncomingMapper();
    private readonly consumerKey = "access-control.membership.v1";

    public constructor(
        @Inject(MEMBERSHIP_COMMANDS)
        private readonly membershipCommands: Commands.Membership.ConsumerContract,
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
            topic: KafkaTopic.MEMBERSHIP,
            handler: this,
        });
    }

    @EventPattern(KafkaTopic.MEMBERSHIP)
    public async handle(
        @Payload() message: Consumers.Membership.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Membership.Handle.Result {
        const incoming = this.incomingMapper.map({ consumerKey: this.consumerKey, context });
        try {
            await this.process({ incoming, message });
        } catch (error) {
            await this.reject({ incoming, message, error });
        }
    }

    public async process(props: Consumers.Membership.Process.Props): Consumers.Membership.Process.Result {
        const { incoming, message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.MEMBERSHIP, value: message });
        switch (message.actionType) {
            case MembershipTopicAction.JOIN_REQUESTED:
                await this.membershipCommands.join({ incoming, ...message.payload });
                break;
            case MembershipTopicAction.LEAVE_REQUESTED:
                await this.membershipCommands.leave({ incoming, ...message.payload });
                break;
            default:
                this.logger.warn(`Unknown membership action type: ${message.actionType}`);
        }
    }

    public async reject(props: Consumers.Membership.Reject.Props): Consumers.Membership.Reject.Result {
        const { incoming, message, error } = props;
        const retryable = Exception.isRetryable(error);

        if (!retryable) {
            this.logger.warn(`Non-retryable error in membership consumer: ${String(error)}`);
        }

        await lastValueFrom(
            this.kafkaClient.emit(retryable ? KafkaTopicBuilder.retry(KafkaTopic.MEMBERSHIP) : KafkaTopic.MEMBERSHIP_DEAD, {
                key: incoming.event,
                value: {
                    originalTopic: KafkaTopic.MEMBERSHIP,
                    error: String(error),
                    payload: message,
                },
            }),
        );

        if (retryable) {
            this.kafkaMetrics.recordRetry({ topic: KafkaTopic.MEMBERSHIP, error });
        } else {
            this.kafkaMetrics.recordDead({ topic: KafkaTopic.MEMBERSHIP, error });
        }
    }
}
