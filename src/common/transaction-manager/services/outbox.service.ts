import { AuditLogTopicAction, ChangeLogTopicAction } from "@monadiam/shared";
import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { KAFKA_SCHEMA_REGISTRY } from "~infrastructure/kafka";
import { KafkaTopic } from "~context/enums";

import { Outbox } from "../entities";

@Injectable()
export class OutboxService implements TransactionManager.Outbox.Contract {
    private readonly serviceName: string;

    public constructor(
        @Inject(KAFKA_SCHEMA_REGISTRY)
        private readonly schemaRegistry: Kafka.SchemaRegistry.PublicContract,
        private readonly configService: ConfigService,
    ) {
        this.serviceName = this.configService.getOrThrow<string>("SERVICE_NAME");
    }

    public build(props: TransactionManager.Outbox.Build.Props): TransactionManager.Outbox.Build.Result {
        const outbox = new Outbox(props);
        this.schemaRegistry.validate({ topic: outbox.destinationTopic, value: outbox.envelope() });
        return outbox;
    }

    public buildAuditLogArchive(
        props: TransactionManager.Outbox.BuildAuditLogArchive.Props,
    ): TransactionManager.Outbox.BuildAuditLogArchive.Result {
        return this.build({
            destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE,
            actionType: AuditLogTopicAction.ARCHIVE,
            payload: {
                input: props.input ? JSON.stringify(props.input) : null,
                created_at: props.createdAt.toISOString(),
                user_agent: props.userAgent ?? null,
                action_type: props.actionType,
                entity_type: props.entityType,
                realm: props.realm ?? null,
                actor: props.actor ?? null,
                service: this.serviceName,
                ip: props.ip ?? null,
                id: props.id,
            },
        });
    }

    public buildChangeLogArchive(
        props: TransactionManager.Outbox.BuildChangeLogArchive.Props,
    ): TransactionManager.Outbox.BuildChangeLogArchive.Result {
        return this.build({
            destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE,
            actionType: ChangeLogTopicAction.ARCHIVE,
            payload: {
                created_at: props.createdAt.toISOString(),
                delta: JSON.stringify(props.delta),
                audit_entry: props.auditEntry,
                change_type: props.changeType,
                entity_type: props.entityType,
                service: this.serviceName,
                entity: props.entity,
                id: props.id,
            },
        });
    }
}
