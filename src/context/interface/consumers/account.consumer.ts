import { EventPattern, KafkaContext, Payload, ClientKafka, Ctx } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { AccountTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { ACCOUNT_ROLE_ASSIGNMENT_COMMANDS } from "~context/application/commands";
import { KafkaMetricsRecorder } from "~observability/metrics/kafka.recorder";
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
export class AccountConsumer implements OnModuleInit, Consumers.Account.Contract {
    private readonly incomingMapper = new KafkaIncomingMapper();
    private readonly logger = new Logger(AccountConsumer.name);
    private readonly consumerKey = "access-control.account.v1";

    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_COMMANDS)
        private readonly accountRoleAssignmentCommands: Commands.AccountRoleAssignment.ConsumerContract,
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
            topic: KafkaTopic.ACCOUNT,
            handler: this,
        });
    }

    @EventPattern(KafkaTopic.ACCOUNT)
    public async handle(
        @Payload() message: Consumers.Account.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Account.Handle.Result {
        const incoming = this.incomingMapper.map({ consumerKey: this.consumerKey, context });
        try {
            await this.process({ incoming, message });
        } catch (error) {
            await this.reject({ incoming, message, error });
        }
    }

    public async process(props: Consumers.Account.Process.Props): Consumers.Account.Process.Result {
        const { incoming, message } = props;
        this.schemaRegistry.validate({ topic: KafkaTopic.ACCOUNT, value: message });
        switch (message.actionType) {
            case AccountTopicAction.CREATE:
                await this.accountRoleAssignmentCommands.assign({ incoming, account: message.payload.account });
                break;
            case AccountTopicAction.PURGE:
                await this.accountRoleAssignmentCommands.clean({ incoming, account: message.payload.account });
                break;
            default:
                this.logger.warn(`Unknown membership action type: ${message.actionType}`);
        }
    }

    public async reject(props: Consumers.Account.Reject.Props): Consumers.Account.Reject.Result {
        const { incoming, message, error } = props;
        const retryable = Exception.isRetryable(error);

        if (!retryable) {
            this.logger.warn(`Non-retryable error in account consumer: ${String(error)}`);
        }

        await lastValueFrom(
            this.kafkaClient.emit(retryable ? KafkaTopicBuilder.retry(KafkaTopic.ACCOUNT) : KafkaTopic.ACCOUNT_DEAD, {
                key: incoming.event,
                value: {
                    originalTopic: KafkaTopic.ACCOUNT,
                    error: String(error),
                    payload: message,
                },
            }),
        );

        if (retryable) {
            this.kafkaMetrics.recordRetry({ topic: KafkaTopic.ACCOUNT, error });
        } else {
            this.kafkaMetrics.recordDead({ topic: KafkaTopic.ACCOUNT, error });
        }
    }
}
