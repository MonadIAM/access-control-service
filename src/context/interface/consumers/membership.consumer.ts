import { EventPattern, KafkaContext, Payload, ClientKafka, Ctx } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { MembershipTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KAFKA_RETRY_SERVICE, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE, KafkaIncomingMapper } from "~infrastructure/kafka";
import { KAFKA_METRICS_RECORDER } from "~observability/metrics/tokens";
import { MEMBERSHIP_COMMANDS } from "~context/application/commands";
import { KafkaTopic } from "~context/enums";

@Controller()
export class MembershipConsumer implements Consumers.Membership.Contract, OnModuleInit {
    private readonly logger = new Logger(MembershipConsumer.name);
    private readonly incomingMapper = new KafkaIncomingMapper();
    private readonly consumerKey = "access-control.membership.v1";

    public constructor(
        @Inject(MEMBERSHIP_COMMANDS)
        private readonly membershipCommands: Commands.Membership.ConsumerContract,
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

    @EventPattern(KafkaTopic.MEMBERSHIP)
    public async handle(
        @Payload() message: Consumers.Membership.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Membership.Handle.Result {
        const incoming = {
            consumerKey: this.consumerKey,
            event: this.incomingMapper.reference({ context }),
        };
        await this.kafkaRetry.execute({
            topic: KafkaTopic.MEMBERSHIP,
            heartbeat: context.getHeartbeat(),
            process: () =>
                this.process({
                    incoming: this.incomingMapper.map({ consumerKey: this.consumerKey, context }),
                    message,
                }),
            reject: (error) => this.reject({ incoming, message, error }),
        });
    }

    public async process(props: Consumers.Membership.Process.Props): Consumers.Membership.Process.Result {
        const { incoming } = props;
        const message = await this.schemaRegistry.decode<Consumers.Membership.Message>({
            topic: KafkaTopic.MEMBERSHIP,
            value: props.message,
        });
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
        this.logger.warn(`Rejected message in membership consumer: ${String(error)}`);

        await lastValueFrom(
            this.kafkaClient.emit(KafkaTopic.MEMBERSHIP_DEAD, {
                key: incoming.event,
                value: {
                    originalTopic: KafkaTopic.MEMBERSHIP,
                    error: String(error),
                    payload: message,
                },
            }),
        );

        this.kafkaMetrics.recordDead({ topic: KafkaTopic.MEMBERSHIP, error });
    }
}
