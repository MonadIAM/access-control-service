import { Inject, Injectable, Scope } from "@nestjs/common";
import { SYSTEM_REALM_ID } from "@monadiam/shared";

import { RoleActorType, RoleArchetype, RealmType } from "~context/enums";
import { Exception } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    PERMISSION_OVERRIDE_REPOSITORY,
    PERMISSION_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";
import {
    PROJECT_ADMIN_PERMISSION_CODES,
    PROJECT_USER_PERMISSION_CODES,
    ADMIN_PERMISSION_CODES,
    USER_PERMISSION_CODES,
} from "~infrastructure/datasets/bootstrap";

import { RolePermissionAssignment, AccountRoleAssignment, RoleClosure, Realm, Role } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RealmService implements Services.Realm.Contract {
    private readonly dictionaryPath = "services.realm";

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly assignmentRepository: Repositories.AccountRoleAssignment.PublicContract,
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly overrideRepository: Repositories.PermissionOverride.PublicContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.PublicContract,
    ) {}

    public async create(props: Services.Realm.Create.Props): Services.Realm.Create.Result {
        const { transaction, input, actor } = props;
        const limitExceeded = await this.realmRepository.wouldExceedRealmLimit({
            account: actor,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.LIMIT_EXCEEDED` });
        } else {
            const realm = new Realm({ ...input, owner: actor });

            transaction.persist(realm);

            const { paths, roles } = this.createBaseRoles({ transaction, input, realm });

            const permissionAssignments = await this.assignBasePermissions({ transaction, roles, realm });
            const roleAssignments = this.assignBaseRoles({ transaction, roles, realm, actor });

            return {
                roles: Object.values(roles),
                realm,
                paths,
                assignments: {
                    permission: permissionAssignments,
                    role: roleAssignments,
                },
            };
        }
    }

    public async bootstrapOrganization(
        props: Services.Realm.BootstrapOrganization.Props,
    ): Services.Realm.BootstrapOrganization.Result {
        const { transaction, realm: id, input } = props;
        const existing = await this.realmRepository.findUnique({ where: { id }, transaction });

        if (existing) {
            throw Exception.conflict({ messageKey: "services.realm.ALREADY_EXISTS" });
        } else {
            const limitExceeded = await this.realmRepository.wouldExceedRealmLimit({ account: input.owner, transaction });

            if (limitExceeded) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.LIMIT_EXCEEDED` });
            } else {
                const realm = new Realm({
                    id,
                    type: RealmType.ORGANIZATION,
                    owner: input.owner,
                    code: id,
                    name: input.name,
                    description: input.description,
                });
                transaction.persist(realm);

                const { paths, roles } = this.createBaseRoles({
                    transaction,
                    realm,
                    input: { code: id, name: input.name },
                });
                const permission = await this.assignBasePermissions({ transaction, roles, realm });
                const role = this.assignBaseRoles({ transaction, roles, realm, actor: input.owner });

                return { realm, paths, roles: Object.values(roles), assignments: { permission, role } };
            }
        }
    }

    public async bootstrapProject(props: Services.Realm.BootstrapProject.Props): Services.Realm.BootstrapProject.Result {
        const { transaction, realm: id, input } = props;
        const existing = await this.realmRepository.findUnique({ where: { id }, transaction });

        if (existing) {
            throw Exception.conflict({ messageKey: "services.realm.ALREADY_EXISTS" });
        } else {
            await this.realmRepository.findUniqueOrThrow({
                where: { id: input.organizationRealm, type: RealmType.ORGANIZATION, isRevoked: false },
                transaction,
            });

            const realm = new Realm({
                id,
                type: RealmType.PROJECT,
                owner: input.owner,
                code: id,
                name: input.name,
                description: input.description,
            });
            transaction.persist(realm);

            const { paths, roles } = this.createBaseRoles({ transaction, realm, input: { code: id, name: input.name } });
            const permission = await this.assignBasePermissions({ transaction, roles, realm });
            const role = this.assignBaseRoles({ transaction, roles, realm, actor: input.owner });

            return { realm, paths, roles: Object.values(roles), assignments: { permission, role } };
        }
    }

    public createBaseRoles(props: Services.Realm.CreateBaseRoles.Props): Services.Realm.CreateBaseRoles.Result {
        const { transaction, input, realm } = props;
        const root = new Role({
            description: "Role not available to users",
            isSystemManaged: true,
            archetype: RoleArchetype.COMPOSITE,
            actorType: RoleActorType.HUMAN,
            name: `${input.name} System`,
            code: `${input.code}.root`,
            realm,
        });
        const user = new Role({
            description: "Basic role for all users",
            archetype: RoleArchetype.COMPOSITE,
            actorType: RoleActorType.HUMAN,
            name: `${input.name} User`,
            code: `${input.code}.user`,
            realm,
        });
        const admin = new Role({
            description: "The role that grants maximum privileges",
            name: `${input.name} Administrator`,
            code: `${input.code}.administrator`,
            archetype: RoleArchetype.COMPOSITE,
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
        const adminCodes = realm.type === RealmType.PROJECT ? PROJECT_ADMIN_PERMISSION_CODES : ADMIN_PERMISSION_CODES;
        const userCodes = realm.type === RealmType.PROJECT ? PROJECT_USER_PERMISSION_CODES : USER_PERMISSION_CODES;
        const permissions = await this.permissionRepository.find({
            where: { code: { $in: adminCodes }, realm: SYSTEM_REALM_ID },
            transaction,
        });

        if (permissions.length === adminCodes.length) {
            const assignments: Entities.RolePermissionAssignment[] = [];

            for (const permission of permissions) {
                const adminAssignment = new RolePermissionAssignment({ role: roles.admin, permission, realm });
                transaction.persist(adminAssignment);
                assignments.push(adminAssignment);
                if (userCodes.includes(permission.code)) {
                    const userAssignment = new RolePermissionAssignment({ role: roles.user, permission, realm });
                    transaction.persist(userAssignment);
                    assignments.push(userAssignment);
                }
            }

            return assignments;
        } else {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.MISSING_SYSTEM_PERMISSIONS` });
        }
    }

    public async update(props: Services.Realm.Update.Props): Services.Realm.Update.Result {
        const { transaction, patch, id } = props;
        const entity = await this.realmRepository.findUniqueOrThrow({
            where: { id },
            transaction,
        });

        entity.update({ patch });
    }

    public async revoke(props: Services.Realm.Revoke.Props): Services.Realm.Revoke.Result {
        const { transaction, identifiers } = props;
        const unique = Array.from(new Set(identifiers));
        const entities = await this.realmRepository.find({
            where: { id: { $in: unique } },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.REALMS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.revoke();
            }

            return entities;
        }
    }

    public async restore(props: Services.Realm.Restore.Props): Services.Realm.Restore.Result {
        const { transaction, identifiers } = props;
        const unique = Array.from(new Set(identifiers));
        const entities = await this.realmRepository.find({
            where: { id: { $in: unique } },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.REALMS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.restore();
            }

            return entities;
        }
    }

    public async purge(props: Services.Realm.Purge.Props): Services.Realm.Purge.Result {
        const { transaction, identifiers } = props;
        const unique = Array.from(new Set(identifiers));
        const entities = await this.realmRepository.find({
            where: { id: { $in: unique } },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.REALMS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.canPurge();
                transaction.remove(entity);
            }

            return entities;
        }
    }

    public async revokeBySystem(props: Services.Realm.RevokeBySystem.Props): Services.Realm.RevokeBySystem.Result {
        const { transaction, realm } = props;
        const entity = await this.realmRepository.findUniqueOrThrow({
            where: { id: realm, isSystemManaged: false },
            transaction,
        });

        if (entity.isRevoked && !entity.isSystemRevoked) {
            return [];
        } else {
            entity.revokeBySystem();

            return [entity];
        }
    }

    public async restoreBySystem(props: Services.Realm.RestoreBySystem.Props): Services.Realm.RestoreBySystem.Result {
        const { transaction, realm } = props;
        const entity = await this.realmRepository.findUniqueOrThrow({
            where: { id: realm, isSystemManaged: false },
            transaction,
        });

        if (entity.isRevoked && !entity.isSystemRevoked) {
            return [];
        } else {
            entity.restoreBySystem();

            return [entity];
        }
    }

    public async purgeBySystem(props: Services.Realm.PurgeBySystem.Props): Services.Realm.PurgeBySystem.Result {
        const { transaction, realm } = props;
        const entity = await this.realmRepository.findUnique({ where: { id: realm, isSystemManaged: false }, transaction });

        if (entity) {
            transaction.remove(entity);

            return [entity];
        } else {
            return [];
        }
    }

    public async transferOwnership(props: Services.Realm.TransferOwnership.Props): Services.Realm.TransferOwnership.Result {
        const { transaction, input, realm } = props;
        const entity = await this.realmRepository.findUniqueOrThrow({
            where: { id: realm, type: RealmType.ORGANIZATION, isRevoked: false },
            transaction,
        });

        if (entity.owner !== input.previousOwner || input.owner === input.previousOwner) {
            throw Exception.invariantViolation({ messageKey: "services.realm.OWNER_MISMATCH" });
        } else {
            const admin = await this.roleRepository.findUniqueOrThrow({
                where: { realm, code: `${entity.code}.administrator`, isRevoked: false },
                transaction,
            });
            const [previousAssignments, existing] = await Promise.all([
                this.assignmentRepository.find({
                    where: { realm, account: input.previousOwner, role: admin.id },
                    options: { populate: ["realm", "role"] },
                    transaction,
                }),
                this.assignmentRepository.findUnique({
                    where: { realm, account: input.owner, role: admin.id },
                    options: { populate: ["realm", "role"] },
                    transaction,
                }),
            ]);

            for (const assignment of previousAssignments) {
                transaction.remove(assignment);
            }

            const assignment = existing ?? new AccountRoleAssignment({ realm: entity, role: admin, account: input.owner });
            assignment.expiresAt = undefined;

            if (assignment.isRevoked) {
                assignment.restore();
            }

            transaction.persist(assignment);
            entity.owner = input.owner;
            entity.updatedAt = new Date();

            return { realm: entity, assignments: [assignment], previousAssignments };
        }
    }

    public async purgeAccountAccess(
        props: Services.Realm.PurgeAccountAccess.Props,
    ): Services.Realm.PurgeAccountAccess.Result {
        const { transaction, account, realm } = props;

        const [assignments, overrides] = await Promise.all([
            this.assignmentRepository.find({
                where: { account, realm },
                options: { populate: ["role", "realm"] },
                transaction,
            }),
            this.overrideRepository.find({
                where: { account, realm },
                options: { populate: ["permission.realm", "realm"] },
                transaction,
            }),
        ]);

        for (const assignment of assignments) {
            transaction.remove(assignment);
        }

        for (const override of overrides) {
            transaction.remove(override);
        }

        return { assignments, overrides, account, realm };
    }

    public async revokeAccountAccess(
        props: Services.Realm.RevokeAccountAccess.Props,
    ): Services.Realm.RevokeAccountAccess.Result {
        const { transaction, account, realm } = props;

        await this.realmRepository.findUniqueOrThrow({ where: { id: realm }, transaction });

        const [assignments, overrides] = await Promise.all([
            this.assignmentRepository.find({
                where: { account, realm },
                options: { populate: ["role", "realm"] },
                transaction,
            }),
            this.overrideRepository.find({
                where: { account, realm },
                options: { populate: ["permission.realm", "realm"] },
                transaction,
            }),
        ]);

        for (const assignment of assignments) {
            assignment.revokeBySystem();
        }

        for (const override of overrides) {
            override.revokeBySystem();
        }

        return { assignments, overrides, account, realm };
    }

    public async restoreAccountAccess(
        props: Services.Realm.RestoreAccountAccess.Props,
    ): Services.Realm.RestoreAccountAccess.Result {
        const { transaction, account, realm } = props;

        await this.realmRepository.findUniqueOrThrow({ where: { id: realm }, transaction });

        const [assignments, overrides] = await Promise.all([
            this.assignmentRepository.find({
                where: { account, realm },
                options: { populate: ["role", "realm"] },
                transaction,
            }),
            this.overrideRepository.find({
                where: { account, realm },
                options: { populate: ["permission.realm", "realm"] },
                transaction,
            }),
        ]);

        for (const assignment of assignments) {
            assignment.restoreBySystem();
        }

        for (const override of overrides) {
            override.restoreBySystem();
        }

        return { assignments, overrides, account, realm };
    }
}
