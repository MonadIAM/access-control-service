import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { MembershipTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KafkaUtils, KAFKA_SERVICE } from "~infrastructure/kafka";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

import { MEMBERSHIP_COMMANDS } from "../commands";

@Controller()
export class MembershipConsumer implements Consumers.Membership.Contract, OnModuleInit {
    private readonly logger = new Logger(MembershipConsumer.name);

    public constructor(
        @Inject(MEMBERSHIP_COMMANDS)
        private readonly membershipCommands: Commands.Membership.ConsumerContract,
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
        try {
            switch (message.actionType) {
                case MembershipTopicAction.JOIN_REQUESTED:
                    await this.membershipCommands.join({
                        ...message.payload,
                    });
                    break;
                case MembershipTopicAction.LEAVE_REQUESTED:
                    await this.membershipCommands.leave({
                        ...message.payload,
                    });
                    break;
                default:
                    this.logger.warn(`Unknown membership action type: ${message.actionType}`);
            }
        } catch (error) {
            if (Exception.isRetryable(error)) {
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.MEMBERSHIP_RETRY, {
                        headers: {
                            "x-retry-count": String(KafkaUtils.extractRetryCount(context)),
                        },
                        value: {
                            originalTopic: KafkaTopic.MEMBERSHIP,
                            error: String(error),
                            payload: message,
                        },
                    }),
                );
            } else {
                this.logger.warn(`Non-retryable error in membership consumer: ${String(error)}`);
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.MEMBERSHIP_DEAD, {
                        value: {
                            originalTopic: KafkaTopic.MEMBERSHIP,
                            error: String(error),
                            payload: message,
                        },
                    }),
                );
            }
        }
    }
}
