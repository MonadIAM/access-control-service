import { Inject, Injectable, Scope } from "@nestjs/common";

import { RolePermissionAssignment, AccountRoleAssignment, RoleClosure, Realm, Role } from "~context/domain/entities";
import { ADMIN_PERMISSION_CODES, USER_PERMISSION_CODES } from "~infrastructure/datasets/bootstrap";
import { PERMISSION_REPOSITORY, REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { RoleActorType, RoleProtoType } from "~context/enums";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RealmService implements Services.Realm.Contract {
    private readonly dictionaryPath = "services.realm";

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.InternalContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.InternalContract,
    ) {}

    public async create({ transaction, input, actor }: Services.Realm.Create.Props): Promise<Services.Realm.Create.Result> {
        const limitExceeded = await this.realmRepository.wouldExceedRealmLimit({
            account: actor,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.LIMIT_EXCEEDED`);
        } else {
            const realm = new Realm({ ...input, owner: actor });

            transaction.persist(realm);

            const { paths, roles } = this.createBaseRoles({ transaction, input, realm });

            const permissionAssignments = await this.assignBasePermissions({ transaction, roles, realm });
            const roleAssignments = this.assignBaseRoles({ transaction, roles, realm, actor });

            return {
                roles: Object.values(roles),
                assignments: {
                    permission: permissionAssignments,
                    role: roleAssignments,
                },
                realm,
                paths,
            };
        }
    }

    public update({ entity, patch }: Services.Realm.Update): void {
        entity.update({ patch });
    }

    public purge({ transaction, entities }: Services.Realm.Purge): void {
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke({ entities }: Services.Realm.Revoke): void {
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore({ entities }: Services.Realm.Restore): void {
        for (const entity of entities) {
            entity.restore();
        }
    }

    private createBaseRoles({
        transaction,
        input,
        realm,
    }: Services.Realm.CreateBaseRoles.Props): Services.Realm.CreateBaseRoles.Result {
        const root = new Role({
            description: "Role not available to users",
            protoType: RoleProtoType.COMPOSITE,
            actorType: RoleActorType.HUMAN,
            name: `${input.name} System`,
            code: `${input.code}.root`,
            realm,
        });
        const user = new Role({
            description: "Basic role for all users",
            protoType: RoleProtoType.COMPOSITE,
            actorType: RoleActorType.HUMAN,
            name: `${input.name} User`,
            code: `${input.code}.user`,
            realm,
        });
        const admin = new Role({
            description: "The role that grants maximum privileges",
            name: `${input.name} Administrator`,
            code: `${input.code}.administrator`,
            protoType: RoleProtoType.COMPOSITE,
            actorType: RoleActorType.HUMAN,
            realm,
        });

        transaction.persist(root);
        transaction.persist(user);
        transaction.persist(admin);

        const paths: Entities.RoleClosure[] = [
            new RoleClosure({ realm, ancestor: root, descendant: root, depth: 0 }),
            new RoleClosure({ realm, ancestor: user, descendant: user, depth: 0 }),
            new RoleClosure({ realm, ancestor: root, descendant: user, depth: 1 }),
            new RoleClosure({ realm, ancestor: admin, descendant: admin, depth: 0 }),
            new RoleClosure({ realm, ancestor: root, descendant: admin, depth: 1 }),
        ];

        for (const path of paths) {
            transaction.persist(path);
        }

        return {
            roles: { root, admin, user },
            paths,
        };
    }

    private async assignBasePermissions({
        transaction,
        roles,
        realm,
    }: Services.Realm.AssignBasePermissions.Props): Promise<Services.Realm.AssignBasePermissions.Result> {
        const permissions = await this.permissionRepository.find({
            where: { code: { $in: ADMIN_PERMISSION_CODES } },
            transaction,
        });

        if (permissions.length !== ADMIN_PERMISSION_CODES.length) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.MISSING_SYSTEM_PERMISSIONS`);
        }

        const assignments: Entities.RolePermissionAssignment[] = [];

        for (const permission of permissions) {
            const adminAssignment = new RolePermissionAssignment({ role: roles.admin, permission, realm });
            transaction.persist(adminAssignment);
            assignments.push(adminAssignment);
            if (USER_PERMISSION_CODES.includes(permission.code)) {
                const userAssignment = new RolePermissionAssignment({ role: roles.user, permission, realm });
                transaction.persist(userAssignment);
                assignments.push(userAssignment);
            }
        }

        return assignments;
    }

    private assignBaseRoles({
        transaction,
        roles,
        actor,
        realm,
    }: Services.Realm.AssignBaseRoles.Props): Services.Realm.AssignBaseRoles.Result {
        const assignments: Entities.AccountRoleAssignment[] = [
            new AccountRoleAssignment({ account: actor, role: roles.admin, realm }),
        ];

        for (const assignment of assignments) {
            transaction.persist(assignment);
        }

        return assignments;
    }
}
