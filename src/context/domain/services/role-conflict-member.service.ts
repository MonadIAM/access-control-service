import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ROLE_CONFLICT_MEMBER_REPOSITORY } from "~context/infrastructure/repositories";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { RoleConflictMember, AuditJournal } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberService implements Services.RoleConflictMember.Contract {
    private readonly entityType = AccessControlEntityType.CONFLICT_MEMBER;
    private readonly dictionaryPath = "services.roleConflictMember";

    public constructor(
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.Contract,
        private readonly configService: ConfigService,
    ) {}

    public async create({
        transaction,
        context: { userAgent, ip },
        input: { roles, group },
        realm,
        actor,
    }: Services.RoleConflictMember.Create): Promise<void> {
        const members = await this.roleConflictMemberRepository.find({ where: { id: group.id }, transaction });
        const limit = this.configService.getOrThrow<number>("MAX_CONFLECT_MEMBERS_COUNT");

        if (members.length + roles.length > limit) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.`);
        } else {
            for (const role of roles) {
                const entity = new RoleConflictMember({
                    group,
                    actor,
                    role,
                });

                transaction.persist(entity);

                const auditEntity = new AuditJournal({
                    actionType: AccessControlActionType.CREATE,
                    entityType: this.entityType,
                    at: entity.createdAt,
                    entity: entity.id,
                    realm: realm.id,
                    userAgent,
                    by: actor,
                    ip,
                });

                transaction.persist(auditEntity);
            }
            await transaction.flush();
        }
    }

    public async purge({
        transaction,
        context: { userAgent, ip },
        entities,
        reason,
        actor,
    }: Services.RoleConflictMember.Purge): Promise<void> {
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
}
