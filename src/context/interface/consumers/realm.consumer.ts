import { EventPattern, KafkaContext, Payload, ClientKafka, Ctx } from "@nestjs/microservices";
import { Controller, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { RealmTopicAction } from "@monadiam/shared";
import { lastValueFrom } from "rxjs";

import { KAFKA_RETRY_SERVICE, KAFKA_SCHEMA_REGISTRY, KAFKA_SERVICE, KafkaIncomingMapper } from "~infrastructure/kafka";
import { REALM_COMMANDS, ACCOUNT_ROLE_ASSIGNMENT_COMMANDS } from "~context/application/commands/tokens";
import { KAFKA_METRICS_RECORDER } from "~observability/metrics/tokens";
import { KafkaTopic } from "~context/enums";

@Controller()
export class RealmConsumer implements Consumers.Realm.Contract, OnModuleInit {
    private readonly logger = new Logger(RealmConsumer.name);
    private readonly incomingMapper = new KafkaIncomingMapper();
    private readonly consumerKey = "access-control.realm.v1";

    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_COMMANDS)
        private readonly accountRoleAssignmentCommands: Commands.AccountRoleAssignment.ConsumerContract,
        @Inject(REALM_COMMANDS)
        private readonly realmCommands: Commands.Realm.ConsumerContract,
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

    @EventPattern(KafkaTopic.REALM)
    public async handle(
        @Payload() message: Consumers.Realm.Message,
        @Ctx() context: KafkaContext,
    ): Consumers.Realm.Handle.Result {
        const incoming = {
            consumerKey: this.consumerKey,
            event: this.incomingMapper.reference({ context }),
        };
        await this.kafkaRetry.execute({
            topic: KafkaTopic.REALM,
            heartbeat: context.getHeartbeat(),
            process: () =>
                this.process({
                    incoming: this.incomingMapper.map({ consumerKey: this.consumerKey, context }),
                    message,
                }),
            reject: (error) => this.reject({ incoming, message, error }),
        });
    }

    public async process(props: Consumers.Realm.Process.Props): Consumers.Realm.Process.Result {
        const { incoming } = props;
        const message = await this.schemaRegistry.decode<Consumers.Realm.Message>({
            topic: KafkaTopic.REALM,
            value: props.message,
        });
        this.schemaRegistry.validate({ topic: KafkaTopic.REALM, value: message });
        switch (message.actionType) {
            case RealmTopicAction.MEMBERSHIP_JOIN_REQUESTED:
                await this.accountRoleAssignmentCommands.join({ incoming, ...message.payload });
                break;
            case RealmTopicAction.BOOTSTRAP_ORGANIZATION_REQUESTED:
                await this.realmCommands.bootstrapOrganization({ incoming, ...message.payload });
                break;
            case RealmTopicAction.BOOTSTRAP_PROJECT_REQUESTED:
                await this.realmCommands.bootstrapProject({ incoming, ...message.payload });
                break;
            case RealmTopicAction.TRANSFER_OWNERSHIP_REQUESTED:
                await this.realmCommands.transferOwnership({ incoming, ...message.payload });
                break;
            case RealmTopicAction.SYSTEM_REVOKE:
                await this.realmCommands.revokeBySystem({ incoming, ...message.payload });
                break;
            case RealmTopicAction.SYSTEM_RESTORE:
                await this.realmCommands.restoreBySystem({ incoming, ...message.payload });
                break;
            case RealmTopicAction.SYSTEM_PURGE:
                await this.realmCommands.purgeBySystem({ incoming, ...message.payload });
                break;
            case RealmTopicAction.ACCOUNT_ACCESS_REVOKE:
                await this.realmCommands.revokeAccountAccess({ incoming, ...message.payload });
                break;
            case RealmTopicAction.ACCOUNT_ACCESS_RESTORE:
                await this.realmCommands.restoreAccountAccess({ incoming, ...message.payload });
                break;
            case RealmTopicAction.ACCOUNT_ACCESS_PURGE:
                await this.realmCommands.purgeAccountAccess({ incoming, ...message.payload });
                break;
            default:
                break;
        }
    }

    public async reject(props: Consumers.Realm.Reject.Props): Consumers.Realm.Reject.Result {
        const { incoming, message, error } = props;
        this.logger.warn(`Rejected realm event: ${String(error)}`);

        const decoded = await this.schemaRegistry.decode<Consumers.Realm.Message>({
            topic: KafkaTopic.REALM,
            value: message,
        });

        this.schemaRegistry.validate({ topic: KafkaTopic.REALM, value: decoded });

        if (decoded.actionType === RealmTopicAction.BOOTSTRAP_ORGANIZATION_REQUESTED) {
            await this.realmCommands.rejectBootstrap({ incoming, request: decoded.payload, reason: String(error) });
        } else if (
            decoded.actionType === RealmTopicAction.SYSTEM_PURGE ||
            decoded.actionType === RealmTopicAction.SYSTEM_REVOKE ||
            decoded.actionType === RealmTopicAction.SYSTEM_RESTORE
        ) {
            throw error;
        }

        await lastValueFrom(
            this.kafkaClient.emit(KafkaTopic.REALM_DEAD, {
                key: incoming.event,
                value: { originalTopic: KafkaTopic.REALM, error: String(error), payload: message },
            }),
        );

        this.kafkaMetrics.recordDead({ topic: KafkaTopic.REALM, error });
    }
}
