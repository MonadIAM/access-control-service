import { Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { RoleConflictGroup, AuditJournal } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupService implements Services.RoleConflictGroup.Contract {
    private readonly entityType = AccessControlEntityType.CONFLICT_GROUP;

    public constructor() {}

    public async create({
        transaction,
        context: { userAgent, ip },
        realm,
        actor,
        input,
    }: Services.RoleConflictGroup.Create): Promise<void> {
        const entity = new RoleConflictGroup({
            description: input.description,
            maxAllowed: input.maxAllowed,
            code: input.code,
            name: input.name,
            realm,
            actor,
        });

        transaction.persist(entity);
        await transaction.flush();

        const auditEntity = new AuditJournal({
            actionType: AccessControlActionType.CREATE,
            entityType: this.entityType,
            at: entity.createdAt!,
            entity: entity.id!,
            realm: realm.id,
            userAgent,
            by: actor,
            ip,
        });

        transaction.persist(auditEntity);

        await transaction.flush();
    }

    public async update({
        transaction,
        input: { patch, reason },
        context: { userAgent, ip },
        entity,
        realm,
        actor,
    }: Services.RoleConflictGroup.Update): Promise<void> {
        const historyPatch = entity.changeMetadata({ reason, patch, actor });

        const auditEntity = new AuditJournal({
            actionType: AccessControlActionType.UPDATE,
            entityType: this.entityType,
            at: entity.updatedAt!,
            patch: historyPatch,
            entity: entity.id!,
            userAgent,
            by: actor,
            reason,
            realm,
            ip,
        });

        transaction.persist(auditEntity);
        await transaction.flush();
    }

    public async purge({
        transaction,
        context: { userAgent, ip },
        entities,
        reason,
        actor,
    }: Services.RoleConflictGroup.Purge): Promise<void> {
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.DELETE,
                entityType: this.entityType,
                entity: entity.id!,
                at: new Date(),
                userAgent,
                by: actor,
                reason,
                ip,
            });

            transaction.persist(auditEntity);
        }
        await transaction.flush();
    }

    public async revoke({
        transaction,
        context: { userAgent, ip },
        entities,
        reason,
        actor,
    }: Services.RoleConflictGroup.Revoke): Promise<void> {
        for (const entity of entities) {
            entity.revoke({ reason, actor });

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.REVOKE,
                entityType: this.entityType,
                at: entity.updatedAt!,
                entity: entity.id!,
                userAgent,
                by: actor,
                reason,
                ip,
            });

            transaction.persist(auditEntity);
        }
        await transaction.flush();
    }

    public async restore({
        transaction,
        context: { userAgent, ip },
        entities,
        reason,
        actor,
    }: Services.RoleConflictGroup.Restore): Promise<void> {
        for (const entity of entities) {
            entity.restore({ reason, actor });

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.RESTORE,
                entityType: this.entityType,
                at: entity.updatedAt!,
                entity: entity.id!,
                userAgent,
                by: actor,
                reason,
                ip,
            });

            transaction.persist(auditEntity);
        }
        await transaction.flush();
    }
}
