import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { AccountRoleAssignment, AuditJournal } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    ROLE_DELEGATION_POLICY_REPOSITORY,
    ROLE_CONFLICT_GROUP_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentService implements Services.AccountRoleAssignment.Contract {
    private readonly entityType = AccessControlEntityType.REALM;
    private readonly dictionaryPath = "services.account-role-assignment";

    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.Contract,
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.Contract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.Contract,
    ) {}

    public async create({
        transaction,
        input: { account, roles },
        context: { userAgent, ip },
        realm,
        actor,
    }: Services.AccountRoleAssignment.Create): Promise<void> {
        const roleIds = roles.map(({ id }) => id!);
        const [isDelegationAllowed, limitExceeded, hasSoDViolations] = await Promise.all([
            this.roleDelegationPolicyRepository.isDelegationAllowed({
                transaction,
                roles: roleIds,
                realm: realm.id,
                actor,
            }),
            this.accountRoleAssignmentRepository.wouldExceedRoleLimit({
                transaction,
                roles: roleIds,
                account,
            }),
            this.roleConflictGroupRepository.hasViolations({
                transaction,
                roles: roleIds,
                realm: realm.id,
                account,
            }),
        ]);

        if (!isDelegationAllowed) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.DELEGATION_NOT_ALLOWED`);
        } else if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.ACCOUNT_ROLE_LIMIT_EXCEEDED`);
        } else if (hasSoDViolations) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.HAS_SoD_VIOLATIONS`);
        } else {
            for (const role of roles) {
                const entity = new AccountRoleAssignment({
                    account,
                    actor,
                    realm,
                    role,
                });

                entity.canAssign();
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

            await transaction.flush();
        }
    }

    public async purge({
        transaction,
        context: { userAgent, ip },
        entities,
        reason,
        actor,
    }: Services.AccountRoleAssignment.Purge): Promise<void> {
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
    }: Services.AccountRoleAssignment.Revoke): Promise<void> {
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
    }: Services.AccountRoleAssignment.Restore): Promise<void> {
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
