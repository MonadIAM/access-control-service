import { EventPattern, Payload, ClientKafka } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { AccountTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KafkaTopicBuilder, KAFKA_RETRY_REGISTRY, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE } from "~infrastructure/kafka";
import { ACCOUNT_ROLE_ASSIGNMENT_COMMANDS, PERMISSION_OVERRIDE_COMMANDS } from "~context/application/commands";
import { Exception } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

@Controller()
export class AccountConsumer implements OnModuleInit, Consumers.Account.Contract {
    private readonly logger = new Logger(AccountConsumer.name);

    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_COMMANDS)
        private readonly accountRoleAssignmentCommands: Commands.AccountRoleAssignment.ConsumerContract,
        @Inject(PERMISSION_OVERRIDE_COMMANDS)
        private readonly permissionOverrideCommands: Commands.PermissionOverride.ConsumerContract,
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
            topic: KafkaTopic.ACCOUNT,
            handler: this,
        });
    }

    @EventPattern(KafkaTopic.ACCOUNT)
    public async handle(@Payload() message: Consumers.Account.Message): Consumers.Account.Handle.Result {
        try {
            await this.process({ message });
        } catch (error) {
            await this.reject({ message, error });
        }
    }

    public async process(props: Consumers.Account.Process.Props): Consumers.Account.Process.Result {
        const { message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.ACCOUNT, value: message });
        switch (message.actionType) {
            case AccountTopicAction.CREATE:
                await this.accountRoleAssignmentCommands.assign({ account: message.payload.account });
                break;
            case AccountTopicAction.PURGE:
                await this.accountRoleAssignmentCommands.clean({ account: message.payload.account });
                await this.permissionOverrideCommands.clean({ account: message.payload.account });
                break;
            default:
                this.logger.warn(`Unknown membership action type: ${message.actionType}`);
        }
    }

    public async reject(props: Consumers.Account.Reject.Props): Consumers.Account.Reject.Result {
        const { message, error } = props;
        const retryable = Exception.isRetryable(error);

        if (!retryable) {
            this.logger.warn(`Non-retryable error in account consumer: ${String(error)}`);
        }

        await lastValueFrom(
            this.kafkaClient.emit(retryable ? KafkaTopicBuilder.retry(KafkaTopic.ACCOUNT) : KafkaTopic.ACCOUNT_DEAD, {
                value: {
                    originalTopic: KafkaTopic.ACCOUNT,
                    error: String(error),
                    payload: message,
                },
            }),
        );
    }
}
