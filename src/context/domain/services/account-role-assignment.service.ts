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
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.AccountRoleAssignment.Create): Promise<void> {
        const roleIds = input.roles.map(({ id }) => id!);
        const [isDelegationAllowed, limitExceeded, hasSoDViolations] = await Promise.all([
            this.roleDelegationPolicyRepository.isDelegationAllowed({
                realm: realm.id,
                roles: roleIds,
                transaction,
                actor,
            }),
            this.accountRoleAssignmentRepository.wouldExceedRoleLimit({
                account: input.account,
                roles: roleIds,
                transaction,
            }),
            this.roleConflictGroupRepository.hasViolations({
                account: input.account,
                realm: realm.id,
                roles: roleIds,
                transaction,
            }),
        ]);

        if (!isDelegationAllowed) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.DELEGATION_NOT_ALLOWED`);
        } else if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.ACCOUNT_ROLE_LIMIT_EXCEEDED`);
        } else if (hasSoDViolations) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.HAS_SoD_VIOLATIONS`);
        } else {
            for (const role of input.roles) {
                const entity = new AccountRoleAssignment({
                    account: input.account,
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
        }
    }

    public purge({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.AccountRoleAssignment.Purge): void {
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
    }: Services.AccountRoleAssignment.Revoke): void {
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
    }: Services.AccountRoleAssignment.Restore): void {
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
