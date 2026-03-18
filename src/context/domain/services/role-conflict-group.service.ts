import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RoleConflictGroup, RoleConflictMember, AuditJournal } from "~context/domain/entities";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupService implements Services.RoleConflictGroup.Contract {
    private readonly entityType = AccessControlEntityType.CONFLICT_GROUP;
    private readonly dictionaryPath = "services.role-conflict-group";
    private readonly membersLimit: number;

    public constructor(private readonly configService: ConfigService) {
        this.membersLimit = this.configService.getOrThrow<number>("MAX_CONFLICT_MEMBERS_COUNT");
    }

    public create({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.RoleConflictGroup.Create): void {
        if (input.members.length > this.membersLimit) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.MEMBER_LIMIT_EXCEEDED`);
        } else {
            const group = new RoleConflictGroup({
                description: input.description,
                maxAllowed: input.maxAllowed,
                code: input.code,
                name: input.name,
                realm,
                actor,
            });

            for (const role of input.members) {
                const member = new RoleConflictMember({
                    group,
                    actor,
                    role,
                });

                transaction.persist(member);

                const auditMember = new AuditJournal({
                    entityType: AccessControlEntityType.CONFLICT_MEMBER,
                    actionType: AccessControlActionType.CREATE,
                    at: member.createdAt,
                    entity: member.id,
                    realm: realm.id,
                    userAgent,
                    by: actor,
                    ip,
                });

                transaction.persist(auditMember);
            }

            transaction.persist(group);

            const auditGroup = new AuditJournal({
                actionType: AccessControlActionType.CREATE,
                entityType: this.entityType,
                at: group.createdAt,
                entity: group.id,
                realm: realm.id,
                userAgent,
                by: actor,
                ip,
            });

            transaction.persist(auditGroup);
        }
    }

    public update({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.RoleConflictGroup.Update): void {
        const historyPatch = input.entity.changeMetadata({
            reason: input.reason,
            patch: input.patch,
            actor,
        });

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

    public purge({ transaction, context: { userAgent, ip }, input, realm, actor }: Services.RoleConflictGroup.Purge): void {
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
    }: Services.RoleConflictGroup.Revoke): void {
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
    }: Services.RoleConflictGroup.Restore): void {
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
