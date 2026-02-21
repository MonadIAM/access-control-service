import { Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { AuditJournal, Realm } from "~context/domain/entities";
@Injectable({ scope: Scope.DEFAULT })
export class RealmService implements Services.Realm.Contract {
    private readonly entityType = AccessControlEntityType.REALM;

    public async create({
        transaction,
        context: { userAgent, ip },
        input: { actor, ...input },
    }: Services.Realm.Create): Promise<Realm> {
        const entity = new Realm({
            ...input,
            actor,
        });

        transaction.persist(entity);

        const auditEntity = new AuditJournal({
            actionType: AccessControlActionType.CREATE,
            entityType: this.entityType,
            at: entity.createdAt,
            entity: entity.id,
            userAgent,
            by: actor,
            ip,
        });

        transaction.persist(auditEntity);
        await transaction.flush();

        return entity;
    }

    public async update({
        transaction,
        input: { patch, reason },
        context: { userAgent, ip },
        entity,
        actor,
    }: Services.Realm.Update): Promise<void> {
        const historyPatch = entity.changeMetadata({ reason, patch, actor });

        const auditEntity = new AuditJournal({
            actionType: AccessControlActionType.UPDATE,
            entityType: this.entityType,
            at: entity.updatedAt!,
            patch: historyPatch,
            entity: entity.id,
            userAgent,
            by: actor,
            reason,
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
    }: Services.Realm.Purge): Promise<void> {
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.DELETE,
                entityType: this.entityType,
                entity: entity.id,
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
    }: Services.Realm.Revoke): Promise<void> {
        for (const entity of entities) {
            entity.revoke({ reason, actor });

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.REVOKE,
                entityType: this.entityType,
                at: entity.updatedAt!,
                entity: entity.id,
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
    }: Services.Realm.Restore): Promise<void> {
        for (const entity of entities) {
            entity.restore({ reason, actor });

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.RESTORE,
                entityType: this.entityType,
                at: entity.updatedAt!,
                entity: entity.id,
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
