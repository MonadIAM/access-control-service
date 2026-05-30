import { EventPattern, Payload, ClientKafka, Ctx, KafkaContext } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

import { ACCOUNT_ROLE_ASSIGNMENT_COMMANDS, PERMISSION_OVERRIDE_COMMANDS } from "~context/application/commands";
import { KafkaUtils, KAFKA_SERVICE } from "~infrastructure/kafka";
import { RetryableException } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

@Controller()
export class AccountConsumer implements OnModuleInit {
    private readonly logger = new Logger(AccountConsumer.name);

    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_COMMANDS)
        private readonly accountRoleAssignmentCommands: Commands.AccountRoleAssignment.ConsumerContract,
        @Inject(PERMISSION_OVERRIDE_COMMANDS)
        private readonly permissionOverrideCommands: Commands.PermissionOverride.ConsumerContract,
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka,
    ) {}

    public async onModuleInit(): Promise<void> {
        await this.kafkaClient.connect();
    }

    private readonly handlers: Consumers.Account.Handlers = {
        ACCOUNT_REGISTERED: (payload) => this.handleRegistered(payload),
        ACCOUNT_PURGED: (payload) => this.handlePurged(payload),
    };

    @EventPattern(KafkaTopic.ACCOUNT)
    public async handle(@Payload() message: Consumers.Account.Payload, @Ctx() context: KafkaContext): Promise<void> {
        try {
            await this.handlers[message.eventType](message.payload);
        } catch (error) {
            if (RetryableException.is(error)) {
                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.ACCOUNT_RETRY, {
                        value: {
                            originalTopic: KafkaTopic.ACCOUNT,
                            error: String(error),
                            payload: message,
                        },
                        headers: {
                            "x-retry-count": String(KafkaUtils.extractRetryCount(context)),
                        },
                    }),
                );
            } else {
                this.logger.warn(`Non-retryable error in account consumer: ${String(error)}`);

                await lastValueFrom(
                    this.kafkaClient.emit(KafkaTopic.ACCOUNT_DEAD, {
                        value: {
                            originalTopic: KafkaTopic.ACCOUNT,
                            error: String(error),
                            payload: message,
                        },
                    }),
                );
            }
        }
    }

    private async handleRegistered({ account }: Consumers.Account.Register): Promise<void> {
        await this.accountRoleAssignmentCommands.assign({ account });
    }

    private async handlePurged({ account }: Consumers.Account.Purge): Promise<void> {
        await this.accountRoleAssignmentCommands.clean({ account });
        await this.permissionOverrideCommands.clean({ account });
    }
}
