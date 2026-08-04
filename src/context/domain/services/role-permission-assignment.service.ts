import { Inject, Injectable, Scope } from "@nestjs/common";

import { Exception } from "~common/exceptions";

import { ROLE_PERMISSION_ASSIGNMENT_REPOSITORY } from "../repositories";
import { RolePermissionAssignment } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentService implements Services.RolePermissionAssignment.Contract {
    private readonly dictionaryPath = "services.role-permission-assignment";

    public constructor(
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.PublicContract,
    ) {}

    public async create(
        props: Services.RolePermissionAssignment.Create.Props,
    ): Services.RolePermissionAssignment.Create.Result {
        const { transaction, realm, input } = props;
        const limitExceeded = await this.rolePermissionAssignmentRepository.wouldExceedPermissionLimit({
            permissions: input.permissions.map(({ id }) => id!),
            role: input.role.id,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ROLE_PERMISSION_LIMIT_EXCEEDED` });
        } else {
            const entities: Entities.RolePermissionAssignment[] = [];

            for (const permission of input.permissions) {
                const entity = new RolePermissionAssignment({
                    role: input.role,
                    permission,
                    realm,
                });

                entity.canAssign();
                entities.push(entity);
                transaction.persist(entity);
            }

            return entities;
        }
    }

    public purge(props: Services.RolePermissionAssignment.Purge.Props): Services.RolePermissionAssignment.Purge.Result {
        const { transaction, entities } = props;
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke(props: Services.RolePermissionAssignment.Revoke.Props): Services.RolePermissionAssignment.Revoke.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore(
        props: Services.RolePermissionAssignment.Restore.Props,
    ): Services.RolePermissionAssignment.Restore.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.restore();
        }
    }
}
