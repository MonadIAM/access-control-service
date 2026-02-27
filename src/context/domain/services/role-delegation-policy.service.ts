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
                delegator: input.delegator,
                target: input.target,
                description: input.description,
                depthLimit: input.depthLimit,
                realm,
                actor,
            });

            policy.canCreate();
            transaction.persist(policy);

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
    }: Services.RoleDelegationPolicy.Update): Promise<void> {
        const historyPatch = entity.changeData({ reason, patch, actor });

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
    }: Services.RoleDelegationPolicy.Purge): Promise<void> {
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
    }: Services.RoleDelegationPolicy.Revoke): Promise<void> {
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
    }: Services.RoleDelegationPolicy.Restore): Promise<void> {
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
