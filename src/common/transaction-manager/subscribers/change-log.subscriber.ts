import { Utils, wrap, ChangeSetType } from "@mikro-orm/postgresql";
import { Injectable, Inject } from "@nestjs/common";

import { LOG_MASKING_SERVICE, OUTBOX_SERVICE } from "~common/transaction-manager/services";
import { ChangeLog, AuditLog, Outbox } from "~common/transaction-manager/entities";
import { OperationContext } from "~common/transaction-manager/utilities";
import { DeltaChanges } from "~common/transaction-manager/value-objects";
import { ExternalChanges } from "~infrastructure/database/utils/external-changes";

const EXCLUDED_ENTITIES = new Set([AuditLog.name, ChangeLog.name, Outbox.name]);

@Injectable()
export class ChangeLogSubscriber implements ORM.EventSubscriber {
    public constructor(
        @Inject(LOG_MASKING_SERVICE)
        private readonly logMaskingService: TransactionManager.LogMasking.Contract,
        @Inject(OUTBOX_SERVICE)
        private readonly outboxService: TransactionManager.Outbox.Contract,
        private readonly operationContext: OperationContext,
    ) {}

    public async onFlush({ uow, em }: ORM.FlushEventArgs): Promise<void> {
        const context = this.operationContext.get();
        if (context?.changeLogEnabled) {
            const changeSets = [...uow.getChangeSets(), ...ExternalChanges.drain({ entityManager: em })].filter(
                (set) => !EXCLUDED_ENTITIES.has(set.meta.className),
            );

            for await (const changeSet of changeSets) {
                const delta = this.buildDelta(changeSet);

                if (Object.keys(delta).length) {
                    const maskedDelta = await this.logMaskingService.maskChangeLog({ delta });

                    const entity = new ChangeLog({
                        entity: this.stringifyPrimaryKey(changeSet.getPrimaryKey()),
                        entityType: changeSet.meta.className,
                        auditEntry: context.auditEntry,
                        changeType: changeSet.type,
                        delta: maskedDelta,
                    });

                    const hash = await this.logMaskingService.sign({ entity });
                    entity.sign(hash);

                    em.persist(entity);
                    uow.computeChangeSet(entity);

                    const outbox = this.outboxService.buildChangeLogArchive(entity);
                    em.persist(outbox);
                    uow.computeChangeSet(outbox);
                }
            }
        }
    }

    private stringifyPrimaryKey(primaryKey: unknown): string {
        if (Array.isArray(primaryKey)) {
            return primaryKey.map(String).join(":");
        } else if (Utils.isPlainObject(primaryKey)) {
            return Object.values(primaryKey).map(String).join(":");
        } else {
            return String(primaryKey);
        }
    }

    private buildDelta(changeSet: TransactionManager.ChangeLogSubscriber.BuildDelta): ValueObjects.DeltaChanges {
        const delta: ValueObjects.DeltaChanges.ConstructorProps = {};

        switch (changeSet.type) {
            case ChangeSetType.CREATE: {
                for (const [field, newValue] of Object.entries(changeSet.payload)) {
                    delta[field] = this.buildDeltaChange(null, newValue);
                }
                break;
            }
            case ChangeSetType.UPDATE: {
                for (const [field, newValue] of Object.entries(changeSet.payload)) {
                    delta[field] = this.buildDeltaChange(changeSet.originalEntity?.[field] ?? null, newValue);
                }
                break;
            }
            case ChangeSetType.DELETE: {
                const deletedEntity = changeSet.originalEntity ?? changeSet.entity;
                if (deletedEntity) {
                    for (const [field, oldValue] of Object.entries(deletedEntity)) {
                        if (!(Utils.isCollection(oldValue) && !oldValue.isInitialized())) {
                            delta[field] = this.buildDeltaChange(oldValue, null);
                        }
                    }
                }
                break;
            }
        }

        return new DeltaChanges(delta);
    }

    private buildDeltaChange(oldValue: unknown, newValue: unknown): ValueObjects.DeltaChanges.ConstructorProps[string] {
        return {
            old: this.normalizeDeltaValue(oldValue),
            new: this.normalizeDeltaValue(newValue),
        };
    }

    private normalizeDeltaValue(value: unknown): unknown {
        if (value instanceof Date) {
            return value;
        } else if (Array.isArray(value)) {
            return value.map((item) => this.normalizeDeltaValue(item));
        } else if (Utils.isCollection(value)) {
            if (value.isInitialized()) {
                return value.getIdentifiers();
            } else {
                return [];
            }
        } else if (Utils.isEntity(value, true)) {
            return wrap(value, true).getPrimaryKey();
        } else if (Utils.isPlainObject(value)) {
            return Object.fromEntries(
                Object.entries(value).map(([field, fieldValue]) => [field, this.normalizeDeltaValue(fieldValue)]),
            );
        } else {
            return value;
        }
    }
}
