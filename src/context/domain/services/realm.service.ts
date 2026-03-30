import { Inject, Injectable, Scope } from "@nestjs/common";

import { RolePermissionAssignment, AccountRoleAssignment, Realm, Role, RoleClosure } from "~context/domain/entities";
import { PERMISSION_REPOSITORY, REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { PermissionCode, RoleActorType, RoleProtoType } from "~context/enums";
import { ServiceException } from "~common/exceptions";

const USER_PERMISSION_CODES: string[] = [
    PermissionCode.ROLE_READ_COMMON,
    PermissionCode.ROLE_READ_PERSONAL,

    PermissionCode.PERMISSION_READ_COMMON,
    PermissionCode.PERMISSION_READ_PERSONAL,

    PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_READ_COMMON,
    PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_CREATE,
    PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_REVOKE,
    PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_RESTORE,
    PermissionCode.ACCOUNT_ROLE_ASSIGNMENT_PURGE,

    PermissionCode.PERMISSION_OVERRIDE_READ_PERSONAL,

    PermissionCode.ROLE_PERMISSION_ASSIGNMENT_READ_COMMON,

    PermissionCode.ROLE_DELEGATION_POLICY_READ_COMMON,
];

const ADMIN_PERMISSION_CODES: string[] = [
    ...USER_PERMISSION_CODES,

    PermissionCode.REALM_READ_ABSOLUTE,
    PermissionCode.REALM_UPDATE,
    PermissionCode.REALM_REVOKE,
    PermissionCode.REALM_RESTORE,
    PermissionCode.REALM_PURGE,

    PermissionCode.ROLE_READ_ABSOLUTE,
    PermissionCode.ROLE_CREATE,
    PermissionCode.ROLE_UPDATE,
    PermissionCode.ROLE_REVOKE,
    PermissionCode.ROLE_RESTORE,
    PermissionCode.ROLE_PURGE,
    PermissionCode.ROLE_PURGE_SUBTREE,

    PermissionCode.PERMISSION_READ_ABSOLUTE,
    PermissionCode.PERMISSION_CREATE,
    PermissionCode.PERMISSION_UPDATE,
    PermissionCode.PERMISSION_REVOKE,
    PermissionCode.PERMISSION_RESTORE,
    PermissionCode.PERMISSION_PURGE,

    PermissionCode.ROLE_PERMISSION_ASSIGNMENT_CREATE,
    PermissionCode.ROLE_PERMISSION_ASSIGNMENT_REVOKE,
    PermissionCode.ROLE_PERMISSION_ASSIGNMENT_RESTORE,
    PermissionCode.ROLE_PERMISSION_ASSIGNMENT_PURGE,

    PermissionCode.PERMISSION_OVERRIDE_READ_ABSOLUTE,
    PermissionCode.PERMISSION_OVERRIDE_CREATE,
    PermissionCode.PERMISSION_OVERRIDE_REVOKE,
    PermissionCode.PERMISSION_OVERRIDE_RESTORE,
    PermissionCode.PERMISSION_OVERRIDE_PURGE,

    PermissionCode.ROLE_DELEGATION_POLICY_CREATE,
    PermissionCode.ROLE_DELEGATION_POLICY_UPDATE,
    PermissionCode.ROLE_DELEGATION_POLICY_REVOKE,
    PermissionCode.ROLE_DELEGATION_POLICY_RESTORE,
    PermissionCode.ROLE_DELEGATION_POLICY_PURGE,

    PermissionCode.ROLE_CONFLICT_GROUP_READ_ABSOLUTE,
    PermissionCode.ROLE_CONFLICT_GROUP_CREATE,
    PermissionCode.ROLE_CONFLICT_GROUP_UPDATE,
    PermissionCode.ROLE_CONFLICT_GROUP_REVOKE,
    PermissionCode.ROLE_CONFLICT_GROUP_RESTORE,
    PermissionCode.ROLE_CONFLICT_GROUP_PURGE,

    PermissionCode.ROLE_CONFLICT_MEMBER_READ_ABSOLUTE,
    PermissionCode.ROLE_CONFLICT_MEMBER_CREATE,
    PermissionCode.ROLE_CONFLICT_MEMBER_PURGE,

    PermissionCode.AUDIT_LOG_READ_ABSOLUTE,
    PermissionCode.CHANGE_LOG_READ_ABSOLUTE,
];

@Injectable({ scope: Scope.DEFAULT })
export class RealmService implements Services.Realm.Contract {
    private readonly dictionaryPath = "services.realm";

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
    ) {}

    public async create({ transaction, input, actor }: Services.Realm.Create): Promise<void> {
        const limitExceeded = await this.realmRepository.wouldExceedRealmLimit({
            account: actor,
            transaction,
        });

        if (limitExceeded) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.LIMIT_EXCEEDED`);
        } else {
            const realm = new Realm({ ...input, owner: actor });

            transaction.persist(realm);

            const roles = this.createBaseRoles({ transaction, input, realm });

            await this.assignBasePermissions({ transaction, roles, realm });

            transaction.persist(new AccountRoleAssignment({ account: actor, role: roles.admin, realm }));
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

        transaction.persist(new RoleClosure({ realm, ancestor: root, descendant: root, depth: 0 }));
        transaction.persist(new RoleClosure({ realm, ancestor: user, descendant: user, depth: 0 }));
        transaction.persist(new RoleClosure({ realm, ancestor: root, descendant: user, depth: 1 }));
        transaction.persist(new RoleClosure({ realm, ancestor: admin, descendant: admin, depth: 0 }));
        transaction.persist(new RoleClosure({ realm, ancestor: root, descendant: admin, depth: 1 }));

        return { root, admin, user };
    }

    private async assignBasePermissions({
        transaction,
        roles,
        realm,
    }: Services.Realm.AssignBasePermissions): Promise<void> {
        const permissions = await this.permissionRepository.find({
            where: { code: { $in: ADMIN_PERMISSION_CODES } },
            transaction,
        });

        if (permissions.length !== ADMIN_PERMISSION_CODES.length) {
            throw ServiceException.invariantViolation(`${this.dictionaryPath}.MISSING_SYSTEM_PERMISSIONS`);
        }

        for (const permission of permissions) {
            transaction.persist(new RolePermissionAssignment({ role: roles.admin, permission, realm }));
            if (USER_PERMISSION_CODES.includes(permission.code)) {
                transaction.persist(new RolePermissionAssignment({ role: roles.user, permission, realm }));
            }
        }
    }
}
