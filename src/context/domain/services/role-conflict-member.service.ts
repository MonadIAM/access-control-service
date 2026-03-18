import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_MEMBER_REPOSITORY } from "~context/infrastructure/repositories";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { RoleConflictMember, AuditJournal } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberService implements Services.RoleConflictMember.Contract {
    private readonly entityType = AccessControlEntityType.CONFLICT_MEMBER;
    private readonly dictionaryPath = "services.role-conflict-member";

    public constructor(
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.Contract,
    ) {}

    public async create({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.RoleConflictMember.Create): Promise<void> {
        const isMemberLimitExceeded = await this.roleConflictMemberRepository.wouldExceedMemberLimit({
            count: input.roles.length,
            group: input.group.id,
            transaction,
        });

        if (isMemberLimitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.MEMBER_LIMIT_EXCEEDED`);
        } else {
            for (const role of input.roles) {
                const entity = new RoleConflictMember({
                    group: input.group,
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
        }
    }

    public purge({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.RoleConflictMember.Purge): void {
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
}
