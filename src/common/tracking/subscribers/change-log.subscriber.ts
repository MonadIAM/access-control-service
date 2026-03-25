import { EventSubscriber, FlushEventArgs, ChangeSetType } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";

import { ChangeLog, AuditLog } from "~common/tracking/entities";
import { OperationContext } from "~common/tracking/utilities";

const EXCLUDED_ENTITIES = new Set([AuditLog.name, ChangeLog.name]);

@Injectable()
export class ChangeLogSubscriber implements EventSubscriber {
    public constructor(private readonly operationContext: OperationContext) {}

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
                    }
                }
            }
        }
    }

    private buildDelta(changeSet: Tracking.ChangeLogSubscriber.BuildDelta): DeltaChanges {
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
}
