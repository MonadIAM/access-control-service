import { Inject, Injectable, Scope } from "@nestjs/common";
import { SYSTEM_REALM_ID } from "@monadiam/shared";

import { Exception } from "~common/exceptions";
import {
    ROLE_PERMISSION_ASSIGNMENT_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

import { RolePermissionAssignment } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RolePermissionAssignmentService implements Services.RolePermissionAssignment.Contract {
    private readonly dictionaryPath = "services.role-permission-assignment";

    public constructor(
        @Inject(ROLE_PERMISSION_ASSIGNMENT_REPOSITORY)
        private readonly rolePermissionAssignmentRepository: Repositories.RolePermissionAssignment.PublicContract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.PublicContract,
    ) {}

    public async create(
        props: Services.RolePermissionAssignment.Create.Props,
    ): Services.RolePermissionAssignment.Create.Result {
        const { transaction, realm, input } = props;
        const [realmEntity, role, permissions] = await Promise.all([
            this.realmRepository.findUniqueOrThrow({
                where: { id: realm },
                transaction,
            }),
            this.roleRepository.findUniqueOrThrow({
                where: { id: input.role, realm },
                transaction,
            }),
            this.permissionRepository.find({
                where: { id: { $in: input.permissions }, realm: { $in: [realm, SYSTEM_REALM_ID] } },
                transaction,
            }),
        ]);

        if (permissions.length < input.permissions.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.PERMISSIONS_NOT_FOUND` });
        } else {
            const limitExceeded = await this.rolePermissionAssignmentRepository.wouldExceedPermissionLimit({
                permissions: permissions.map(({ id }) => id),
                role: role.id,
                transaction,
            });

            if (limitExceeded) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ROLE_PERMISSION_LIMIT_EXCEEDED` });
            } else {
                const entities: Entities.RolePermissionAssignment[] = [];

                for (const permission of permissions) {
                    const entity = new RolePermissionAssignment({
                        realm: realmEntity,
                        permission,
                        role,
                    });

                    entity.canAssign();
                    entities.push(entity);
                    transaction.persist(entity);
                }

                return entities;
            }
        }
    }

    public async revoke(
        props: Services.RolePermissionAssignment.Revoke.Props,
    ): Services.RolePermissionAssignment.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.rolePermissionAssignmentRepository.find({
            options: { populate: ["permission.realm"] },
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.revoke();
            }

            return entities;
        }
    }

    public async restore(
        props: Services.RolePermissionAssignment.Restore.Props,
    ): Services.RolePermissionAssignment.Restore.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.rolePermissionAssignmentRepository.find({
            options: { populate: ["permission.realm"] },
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.restore();
            }

            return entities;
        }
    }

    public async purge(
        props: Services.RolePermissionAssignment.Purge.Props,
    ): Services.RolePermissionAssignment.Purge.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.rolePermissionAssignmentRepository.find({
            options: { populate: ["permission.realm"] },
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ASSIGNMENTS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.canPurge();
                transaction.remove(entity);
            }

            return entities;
        }
    }
}
