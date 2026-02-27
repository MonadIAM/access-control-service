import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_PERMISSION_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { RolePermissionAssignment, AuditJournal } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentService implements Services.RolePermissionAssignment.Contract {
    private readonly entityType = AccessControlEntityType.REALM;
    private readonly dictionaryPath = "services.role-permission-assignment";

    public constructor(
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.Contract,
    ) {}

    public async create({
        transaction,
        input: { permissions, role },
        context: { userAgent, ip },
        realm,
        actor,
    }: Services.RolePermissionAssignment.Create): Promise<void> {
        const limitExceeded = await this.rolePermissionAssignmentRepository.wouldExceedPermissionLimit({
            permissions: permissions.map(({ id }) => id!),
            role: role.id,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.ROLE_PERMISSION_LIMIT_EXCEEDED`);
        } else {
            for await (const permission of permissions) {
                const entity = new RolePermissionAssignment({
                    permission,
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
    }: Services.RolePermissionAssignment.Purge): Promise<void> {
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
    }: Services.RolePermissionAssignment.Revoke): Promise<void> {
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
    }: Services.RolePermissionAssignment.Restore): Promise<void> {
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
