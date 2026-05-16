import { Inject, Injectable, Scope } from "@nestjs/common";

import { RolePermissionAssignment, AccountRoleAssignment, RoleClosure, Realm, Role } from "~context/domain/entities";
import { ADMIN_PERMISSION_CODES, USER_PERMISSION_CODES } from "~infrastructure/datasets/bootstrap";
import { PERMISSION_REPOSITORY, REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { RoleActorType, RolePrototype } from "~context/enums";
import { ServiceException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RealmService implements Services.Realm.Contract {
    private readonly dictionaryPath = "services.realm";

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
    ) {}

    public async create(props: Services.Realm.Create.Props): Services.Realm.Create.Result {
        const { transaction, input, actor } = props;
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

    public update(props: Services.Realm.Update.Props): Services.Realm.Update.Result {
        const { entity, patch } = props;
        entity.update({ patch });
    }

    public purge(props: Services.Realm.Purge.Props): Services.Realm.Purge.Result {
        const { transaction, entities } = props;
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke(props: Services.Realm.Revoke.Props): Services.Realm.Revoke.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public restore(props: Services.Realm.Restore.Props): Services.Realm.Restore.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.restore();
        }
    }

    public createBaseRoles(props: Services.Realm.CreateBaseRoles.Props): Services.Realm.CreateBaseRoles.Result {
        const { transaction, input, realm } = props;
        const root = new Role({
            description: "Role not available to users",
            prototype: RolePrototype.COMPOSITE,
            actorType: RoleActorType.HUMAN,
            name: `${input.name} System`,
            code: `${input.code}.root`,
            realm,
        });
        const user = new Role({
            description: "Basic role for all users",
            prototype: RolePrototype.COMPOSITE,
            actorType: RoleActorType.HUMAN,
            name: `${input.name} User`,
            code: `${input.code}.user`,
            realm,
        });
        const admin = new Role({
            description: "The role that grants maximum privileges",
            name: `${input.name} Administrator`,
            code: `${input.code}.administrator`,
            prototype: RolePrototype.COMPOSITE,
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

    public assignBaseRoles(props: Services.Realm.AssignBaseRoles.Props): Services.Realm.AssignBaseRoles.Result {
        const { transaction, roles, actor, realm } = props;
        const assignments: Entities.AccountRoleAssignment[] = [
            new AccountRoleAssignment({ account: actor, role: roles.admin, realm }),
        ];

        for (const assignment of assignments) {
            transaction.persist(assignment);
        }

        return assignments;
    }

    public async assignBasePermissions(
        props: Services.Realm.AssignBasePermissions.Props,
    ): Services.Realm.AssignBasePermissions.Result {
        const { transaction, roles, realm } = props;
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
}
