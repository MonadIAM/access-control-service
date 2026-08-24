import { ChangeLogTopicAction } from "@monadiam/shared";
import { ChangeSetType } from "@mikro-orm/core";
import { ConfigService } from "@nestjs/config";
import { Injectable, Inject } from "@nestjs/common";

import { ChangeLog, AuditLog, Outbox } from "~common/transaction-manager/entities";
import { LOG_MASKING_SERVICE } from "~common/transaction-manager/services";
import { OperationContext } from "~common/transaction-manager/utilities";
import { DeltaChanges } from "~common/transaction-manager/value-objects";
import { KafkaTopic } from "~context/enums";

const EXCLUDED_ENTITIES = new Set([AuditLog.name, ChangeLog.name, Outbox.name]);

@Injectable()
export class ChangeLogSubscriber implements ORM.EventSubscriber {
    private readonly serviceName: string;

    public constructor(
        @Inject(LOG_MASKING_SERVICE)
        private readonly logMaskingService: TransactionManager.LogMasking.Contract,
        private readonly operationContext: OperationContext,
        private readonly configService: ConfigService,
    ) {
        this.serviceName = this.configService.getOrThrow<string>("SERVICE_NAME");
    }

    public async onFlush({ uow, em }: ORM.FlushEventArgs): Promise<void> {
        const context = this.operationContext.get();
        if (context?.changeLogEnabled) {
            const changeSets = uow.getChangeSets().filter((set) => !EXCLUDED_ENTITIES.has(set.meta.className));

            if (changeSets.length) {
                for await (const changeSet of changeSets) {
                    const delta = this.buildDelta(changeSet);
                    if (Object.keys(delta).length) {
                        const maskedDelta = await this.logMaskingService.maskChangeLog({ delta });

                        const entity = new ChangeLog({
                            entity: String(changeSet.getPrimaryKey()),
                            entityType: changeSet.meta.className,
                            auditEntry: context.auditEntry,
                            changeType: changeSet.type,
                            delta: maskedDelta,
                        });

                        const hash = await this.logMaskingService.sign({ entity });
                        entity.sign(hash);

                        em.persist(entity);
                        uow.computeChangeSet(entity);

                        const outbox = this.buildChangeLogArchiveOutbox(entity);
                        em.persist(outbox);
                        uow.computeChangeSet(outbox);
                    }
                }
            }
        }
    }

    private buildDelta(changeSet: TransactionManager.ChangeLogSubscriber.BuildDelta): ValueObjects.DeltaChanges {
        const delta: ValueObjects.DeltaChanges.ConstructorProps = {};

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

        return new DeltaChanges(delta);
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
