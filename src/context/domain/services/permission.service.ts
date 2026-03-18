import { Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { AuditJournal, Permission } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionService implements Services.Permission.Contract {
    private readonly entityType = AccessControlEntityType.REALM;

    public create({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.Permission.Create): Permission {
        const entity = new Permission({
            ...input,
            realm,
            actor,
        });

        transaction.persist(entity);

        const auditEntity = new AuditJournal({
            actionType: AccessControlActionType.CREATE,
            entityType: this.entityType,
            at: entity.createdAt,
            entity: entity.id,
            realm: realm.id,
            by: actor,
            userAgent,
            ip,
        });

        transaction.persist(auditEntity);

        return entity;
    }

    public update({ transaction, context: { userAgent, ip }, input, realm, actor }: Services.Permission.Update): void {
        const historyPatch = input.entity.changeMetadata({ ...input, actor });

        const auditEntity = new AuditJournal({
            actionType: AccessControlActionType.UPDATE,
            entityType: this.entityType,
            at: input.entity.updatedAt!,
            entity: input.entity.id,
            reason: input.reason,
            patch: historyPatch,
            userAgent,
            by: actor,
            realm,
            ip,
        });

        transaction.persist(auditEntity);
    }

    public purge({ transaction, context: { userAgent, ip }, input, realm, actor }: Services.Permission.Purge): void {
        transaction.clear();
        for (const entity of input.entities) {
            entity.canPurge();

            transaction.remove(entity);

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.DELETE,
                entityType: this.entityType,
                reason: input.reason,
                entity: entity.id,
                at: new Date(),
                userAgent,
                by: actor,
                realm,
                ip,
            });

            transaction.persist(auditEntity);
        }
    }

    public revoke({ transaction, context: { userAgent, ip }, input, realm, actor }: Services.Permission.Revoke): void {
        for (const entity of input.entities) {
            entity.revoke({ reason: input.reason, actor });

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.REVOKE,
                entityType: this.entityType,
                at: entity.updatedAt!,
                reason: input.reason,
                entity: entity.id,
                userAgent,
                by: actor,
                realm,
                ip,
            });

            transaction.persist(auditEntity);
        }
    }

    public restore({ transaction, context: { userAgent, ip }, input, realm, actor }: Services.Permission.Restore): void {
        for (const entity of input.entities) {
            entity.restore({ reason: input.reason, actor });

            const auditEntity = new AuditJournal({
                actionType: AccessControlActionType.RESTORE,
                entityType: this.entityType,
                at: entity.updatedAt!,
                reason: input.reason,
                entity: entity.id,
                userAgent,
                by: actor,
                realm,
                ip,
            });

            transaction.persist(auditEntity);
        }
    }
}
