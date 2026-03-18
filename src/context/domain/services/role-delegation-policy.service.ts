import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_DELEGATION_POLICY_REPOSITORY } from "~context/infrastructure/repositories";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { RoleDelegationPolicy, AuditJournal } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleDelegationPolicyService implements Services.RoleDelegationPolicy.Contract {
    private readonly entityType = AccessControlEntityType.DELEGATION_POLICY;
    private readonly dictionaryPath = "services.role-delegation-policy";

    public constructor(
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.Contract,
    ) {}

    public async create({
        transaction,
        context: { userAgent, ip },
        realm,
        actor,
        input,
    }: Services.RoleDelegationPolicy.Create): Promise<void> {
        const existsTransitivePath = await this.roleDelegationPolicyRepository.existsTransitivePath({
            to: input.delegator.id,
            from: input.target.id,
            transaction,
        });

        if (existsTransitivePath) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.EXISTS_TRANSITIVE_PATH`);
        } else {
            const policy = new RoleDelegationPolicy({
                description: input.description,
                depthLimit: input.depthLimit,
                delegator: input.delegator,
                target: input.target,
                realm,
                actor,
            });

            transaction.persist(policy);

            policy.canCreate();

            const policyAudit = new AuditJournal({
                actionType: AccessControlActionType.CREATE,
                entityType: this.entityType,
                at: policy.createdAt,
                entity: policy.id,
                realm: realm.id,
                userAgent,
                by: actor,
                ip,
            });

            transaction.persist(policyAudit);
        }
    }

    public update({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.RoleDelegationPolicy.Update): void {
        const historyPatch = input.entity.changeData({ ...input, actor });

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

    public purge({
        transaction,
        context: { userAgent, ip },
        input,
        realm,
        actor,
    }: Services.RoleDelegationPolicy.Purge): void {
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
    }: Services.RoleDelegationPolicy.Revoke): void {
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
    }: Services.RoleDelegationPolicy.Restore): void {
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
