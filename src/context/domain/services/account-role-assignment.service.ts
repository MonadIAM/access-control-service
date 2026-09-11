import { Inject, Injectable, Scope } from "@nestjs/common";

import { Exception } from "~common/exceptions";
import {
    ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY,
    ROLE_DELEGATION_POLICY_REPOSITORY,
    ROLE_CONFLICT_GROUP_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

import { AccountRoleAssignment } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentService implements Services.AccountRoleAssignment.Contract {
    private readonly dictionaryPath = "services.account-role-assignment";

    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_REPOSITORY)
        private readonly accountRoleAssignmentRepository: Repositories.AccountRoleAssignment.PublicContract,
        @Inject(ROLE_DELEGATION_POLICY_REPOSITORY)
        private readonly roleDelegationPolicyRepository: Repositories.RoleDelegationPolicy.PublicContract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.PublicContract,
    ) {}

    public async create(props: Services.AccountRoleAssignment.Create.Props): Services.AccountRoleAssignment.Create.Result {
        const { transaction, input, realm, actor } = props;
        const [realmEntity, roleEntities] = await Promise.all([
            this.realmRepository.findUniqueOrThrow({
                where: { id: realm },
                transaction,
            }),
            this.roleRepository.find({
                where: { id: { $in: input.roles }, realm },
                transaction,
            }),
        ]);

        if (roleEntities.length < input.roles.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ROLES_NOT_FOUND` });
        } else {
            const roleIds = roleEntities.map(({ id }) => id);
            const [isDelegationAllowed, limitExceeded, hasSoDViolations] = await Promise.all([
                this.roleDelegationPolicyRepository.isDelegationAllowed({
                    roles: roleIds,
                    transaction,
                    realm,
                    actor,
                }),
                this.accountRoleAssignmentRepository.wouldExceedRoleLimit({
                    account: input.account,
                    roles: roleIds,
                    transaction,
                }),
                this.roleConflictGroupRepository.hasGroupsViolatedByAccount({
                    account: input.account,
                    roles: roleIds,
                    transaction,
                    realm,
                }),
            ]);

            if (!isDelegationAllowed) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.DELEGATION_NOT_ALLOWED` });
            } else if (limitExceeded) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.ACCOUNT_ROLE_LIMIT_EXCEEDED` });
            } else if (hasSoDViolations) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.HAS_SoD_VIOLATIONS` });
            } else {
                const entities: Entities.AccountRoleAssignment[] = [];
                for (const role of roleEntities) {
                    const entity = new AccountRoleAssignment({
                        justification: input.justification,
                        expiresAt: input.expiresAt,
                        account: input.account,
                        realm: realmEntity,
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

    public async ensure(props: Services.AccountRoleAssignment.Ensure.Props): Services.AccountRoleAssignment.Ensure.Result {
        const { transaction, input, realm, actor } = props;
        const existing = await this.accountRoleAssignmentRepository.findUnique({
            where: { account: input.account, role: input.role, isRevoked: false, realm },
            options: { populate: ["realm", "role"] },
            transaction,
        });

        if (existing) {
            return [existing];
        } else {
            return await this.create({
                input: { account: input.account, roles: [input.role] },
                transaction,
                realm,
                actor,
            });
        }
    }

    public async assign(props: Services.AccountRoleAssignment.Assign.Props): Services.AccountRoleAssignment.Assign.Result {
        const { transaction, input } = props;
        const [realmEntity, roleEntity] = await Promise.all([
            this.realmRepository.findUniqueOrThrow({
                where: { id: input.realm },
                transaction,
            }),
            this.roleRepository.findUniqueOrThrow({
                where: { id: input.role, realm: input.realm },
                transaction,
            }),
        ]);

        const entity = new AccountRoleAssignment({
            expiresAt: input.expiresAt,
            account: input.account,
            realm: realmEntity,
            role: roleEntity,
        });

        transaction.persist(entity);

        return entity;
    }

    public async revoke(props: Services.AccountRoleAssignment.Revoke.Props): Services.AccountRoleAssignment.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.accountRoleAssignmentRepository.find({
            options: { populate: ["realm", "role"] },
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
        props: Services.AccountRoleAssignment.Restore.Props,
    ): Services.AccountRoleAssignment.Restore.Result {
        const { transaction, identifiers, realm } = props;
        const unique = [...new Set(identifiers)];
        const entities = await this.accountRoleAssignmentRepository.find({
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

    public expire(props: Services.AccountRoleAssignment.Expire.Props): Services.AccountRoleAssignment.Expire.Result {
        const { transaction, entities } = props;
        for (const entity of entities) {
            transaction.merge(entity);
            entity.revoke();
        }
    }

    public purge(props: Services.AccountRoleAssignment.Purge.Props): Services.AccountRoleAssignment.Purge.Result {
        const { transaction, entities } = props;
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public async clean(props: Services.AccountRoleAssignment.Clean.Props): Services.AccountRoleAssignment.Clean.Result {
        const { transaction, input } = props;
        const entities = await this.accountRoleAssignmentRepository.find({
            where: { account: input.account, ...(input.realm ? { realm: input.realm } : {}) },
            options: { populate: ["realm", "role"] },
            transaction,
        });

        for (const entity of entities) {
            transaction.remove(entity);
        }

        return entities;
    }
}
