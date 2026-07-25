import { EventSubscriber, FlushEventArgs, ChangeSetType } from "@mikro-orm/core";
import { ChangeLogTopicAction } from "@monadiam/shared";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";

import { ChangeLog, AuditLog, Outbox } from "~common/transaction-manager/entities";
import { OperationContext } from "~common/transaction-manager/utilities";
import { KafkaTopic } from "~context/enums";

const EXCLUDED_ENTITIES = new Set([AuditLog.name, ChangeLog.name, Outbox.name]);

@Injectable()
export class ChangeLogSubscriber implements EventSubscriber {
    private readonly serviceName: string;

    public constructor(
        private readonly operationContext: OperationContext,
        private readonly configService: ConfigService,
    ) {
        this.serviceName = this.configService.getOrThrow<string>("SERVICE_NAME");
    }

    public onFlush({ uow, em }: FlushEventArgs): void {
        const context = this.operationContext.get();
        if (context?.changeLogEnabled) {
            const changeSets = uow.getChangeSets().filter((set) => !EXCLUDED_ENTITIES.has(set.name));

            if (changeSets.length) {
                for (const changeSet of changeSets) {
                    const delta = this.buildDelta(changeSet);
                    if (Object.keys(delta).length) {
                        const record = new ChangeLog({
                            entity: String(changeSet.getPrimaryKey()),
                            auditEntry: context.auditEntry,
                            changeType: changeSet.type,
                            entityType: changeSet.name,
                            delta,
                        });

                        em.persist(record);
                        uow.computeChangeSet(record);

                        const outbox = this.buildChangeLogArchiveOutbox(record);
                        em.persist(outbox);
                        uow.computeChangeSet(outbox);
                    }
                }
            }
        }
    }

    private buildDelta(changeSet: TransactionManager.ChangeLogSubscriber.BuildDelta): DeltaChanges {
        const delta: DeltaChanges = {};

        switch (changeSet.type) {
            case ChangeSetType.CREATE: {
                for (const [field, newValue] of Object.entries(changeSet.payload)) {
                    delta[field] = { old: null, new: newValue };
                }
                break;
            }
            case ChangeSetType.UPDATE: {
                for (const [field, newValue] of Object.entries(changeSet.payload)) {
                    delta[field] = {
                        old: changeSet.originalEntity?.[field] ?? null,
                        new: newValue,
                    };
                }
                break;
            }
            case ChangeSetType.DELETE: {
                if (changeSet.originalEntity) {
                    for (const [field, oldValue] of Object.entries(changeSet.originalEntity)) {
                        delta[field] = { old: oldValue, new: null };
                    }
                }
                break;
            }
        }

        return delta;
    }

    private buildChangeLogArchiveOutbox(record: ChangeLog): Outbox {
        return new Outbox({
            destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE,
            actionType: ChangeLogTopicAction.ARCHIVE,
            payload: {
                id: record.id,
                service: this.serviceName,
                created_at: record.createdAt.toISOString(),
                audit_entry: record.auditEntry,
                change_type: record.changeType,
                entity_type: record.entityType,
                entity: record.entity,
                delta: JSON.stringify(record.delta),
            },
        });
    }
}
