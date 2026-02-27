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

    public async create({
        transaction,
        context: { userAgent, ip },
        input: { members, ...input },
        realm,
        actor,
    }: Services.RoleConflictGroup.Create): Promise<void> {
        if (members.length > this.membersLimit) {
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

            for (const role of members) {
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

            await transaction.flush();
        }
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
            entity: entity.id,
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
    }: Services.RoleConflictGroup.Revoke): Promise<void> {
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
    }: Services.RoleConflictGroup.Restore): Promise<void> {
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
