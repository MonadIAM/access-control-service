import { Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { AuditJournal, PermissionOverride } from "~context/domain/entities";
@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideService implements Services.PermissionOverride.Contract {
    private readonly entityType = AccessControlEntityType.PERMISSION_OVERRIDE;

    public async create({
        transaction,
        context: { userAgent, ip },
        realm,
        actor,
        input,
    }: Services.PermissionOverride.Create): Promise<void> {
        const entity = new PermissionOverride({
            ...input,
            actor,
            realm,
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
    }

    public async purge({
        transaction,
        context: { userAgent, ip },
        entities,
        reason,
        actor,
    }: Services.PermissionOverride.Purge): Promise<void> {
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
    }: Services.PermissionOverride.Revoke): Promise<void> {
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
    }: Services.PermissionOverride.Restore): Promise<void> {
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
