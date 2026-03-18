import { Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { AuditJournal, PermissionOverride } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideService implements Services.PermissionOverride.Contract {
    private readonly entityType = AccessControlEntityType.PERMISSION_OVERRIDE;

    public create({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.PermissionOverride.Create): void {
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
    }

    public purge({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.PermissionOverride.Purge): void {
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

    public revoke({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.PermissionOverride.Revoke): void {
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

    public restore({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.PermissionOverride.Restore): void {
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
