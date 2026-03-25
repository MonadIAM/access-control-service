import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_PERMISSION_ASSIGNMENT_REPOSITORY } from "~context/infrastructure/repositories";
import { RolePermissionAssignment } from "~context/domain/entities";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentService implements Services.RolePermissionAssignment.Contract {
    private readonly dictionaryPath = "services.role-permission-assignment";

    public constructor(
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.Contract,
    ) {}

    public async create({ transaction, realm, input }: Services.RolePermissionAssignment.Create): Promise<void> {
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
                    realm,
                });

                entity.canAssign();
                transaction.persist(entity);
            }
        }
    }

    public purge({ transaction, entities }: Services.RolePermissionAssignment.Purge): void {
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ entities }: Services.RolePermissionAssignment.Revoke): void {
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore({ entities }: Services.RolePermissionAssignment.Restore): void {
        for (const entity of entities) {
            entity.restore();
        }
    }
}
