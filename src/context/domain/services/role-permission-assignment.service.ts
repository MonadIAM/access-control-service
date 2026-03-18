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
        context: { userAgent, ip },
        realm,
        input,
        actor,
    }: Services.RolePermissionAssignment.Create): Promise<void> {
        const limitExceeded = await this.rolePermissionAssignmentRepository.wouldExceedPermissionLimit({
            permissions: input.permissions.map(({ id }) => id!),
            role: input.role.id,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.ROLE_PERMISSION_LIMIT_EXCEEDED`);
        } else {
            for (const permission of input.permissions) {
                const entity = new RolePermissionAssignment({
                    role: input.role,
                    permission,
                    actor,
                    realm,
                });

                entity.canAssign();

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
    }: Services.RolePermissionAssignment.Purge): void {
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
    }: Services.RolePermissionAssignment.Revoke): void {
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
    }: Services.RolePermissionAssignment.Restore): void {
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
