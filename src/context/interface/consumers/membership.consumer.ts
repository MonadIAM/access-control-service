import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { MembershipTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KafkaTopicBuilder, KAFKA_RETRY_REGISTRY, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { MEMBERSHIP_COMMANDS } from "~context/application/commands";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

@Controller()
export class MembershipConsumer implements Consumers.Membership.Contract, OnModuleInit {
    private readonly logger = new Logger(MembershipConsumer.name);

    public constructor(
        @Inject(MEMBERSHIP_COMMANDS)
        private readonly membershipCommands: Commands.Membership.ConsumerContract,
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
            topic: KafkaTopic.MEMBERSHIP,
            handler: this,
        });
    }

    @EventPattern(KafkaTopic.MEMBERSHIP)
    public async handle(@Payload() message: Consumers.Membership.Message): Consumers.Membership.Handle.Result {
        try {
            await this.process({ message });
        } catch (error) {
            await this.reject({ message, error });
        }
    }

    public async process(props: Consumers.Membership.Process.Props): Consumers.Membership.Process.Result {
        const { message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.MEMBERSHIP, value: message });
        switch (message.actionType) {
            case MembershipTopicAction.JOIN_REQUESTED:
                await this.membershipCommands.join({ ...message.payload });
                break;
            case MembershipTopicAction.LEAVE_REQUESTED:
                await this.membershipCommands.leave({ ...message.payload });
                break;
            default:
                this.logger.warn(`Unknown membership action type: ${message.actionType}`);
        }
    }

    public async reject(props: Consumers.Membership.Reject.Props): Consumers.Membership.Reject.Result {
        const { message, error } = props;
        const retryable = Exception.isRetryable(error);

        if (!retryable) {
            this.logger.warn(`Non-retryable error in membership consumer: ${String(error)}`);
        }

        await lastValueFrom(
            this.kafkaClient.emit(retryable ? KafkaTopicBuilder.retry(KafkaTopic.MEMBERSHIP) : KafkaTopic.MEMBERSHIP_DEAD, {
                value: {
                    originalTopic: KafkaTopic.MEMBERSHIP,
                    error: String(error),
                    payload: message,
                },
            }),
        );
    }
}
