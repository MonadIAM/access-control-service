import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ROLE_CONFLICT_GROUP_REPOSITORY, REALM_REPOSITORY, ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { RoleConflictGroup, RoleConflictMember } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupService implements Services.RoleConflictGroup.Contract {
    private readonly dictionaryPath = "services.role-conflict-group";
    private readonly membersLimit: number;

    public constructor(
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.PublicContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.PublicContract,
        private readonly configService: ConfigService,
    ) {
        this.membersLimit = this.configService.getOrThrow<number>("MAX_CONFLICT_MEMBERS_COUNT");
    }

    public async create(props: Services.RoleConflictGroup.Create.Props): Services.RoleConflictGroup.Create.Result {
        const { transaction, input, realm } = props;
        if (input.members.length > this.membersLimit) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.MEMBER_LIMIT_EXCEEDED` });
        } else {
            const [realmEntity, members] = await Promise.all([
                this.realmRepository.findUniqueOrThrow({
                    where: { id: realm },
                    transaction,
                }),
                this.roleRepository.find({
                    where: { id: { $in: input.members }, realm },
                    transaction,
                }),
            ]);

            if (members.length < input.members.length) {
                throw Exception.notFound({ messageKey: `${this.dictionaryPath}.ROLES_NOT_FOUND` });
            } else {
                const limitExceeded = await this.roleConflictGroupRepository.wouldExceedGroupLimit({
                    transaction,
                    realm,
                });

                if (limitExceeded) {
                    throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.LIMIT_EXCEEDED` });
                } else {
                    const hasViolators = await this.roleConflictGroupRepository.hasAccountsViolatingRule({
                        identifiers: members.map((role) => role.id),
                        maxAllowed: input.maxAllowed,
                        transaction,
                        realm,
                    });

                    if (hasViolators) {
                        throw Exception.invariantViolation({
                            messageKey: `${this.dictionaryPath}.HAS_ACCOUNTS_VIOLATING_RULE`,
                        });
                    } else {
                        const group = new RoleConflictGroup({
                            description: input.description,
                            maxAllowed: input.maxAllowed,
                            realm: realmEntity,
                            code: input.code,
                            name: input.name,
                        });

                        for (const role of members) {
                            transaction.persist(new RoleConflictMember({ group, role }));
                        }

                        transaction.persist(group);
                    }
                }
            }
        }
    }

    public async update(props: Services.RoleConflictGroup.Update.Props): Services.RoleConflictGroup.Update.Result {
        const { transaction, realm, patch, id } = props;
        const entity = await this.roleConflictGroupRepository.findUniqueOrThrow({
            options: { populate: ["members", "members.role"] },
            where: { id, realm },
            transaction,
        });

        if (patch.maxAllowed && patch.maxAllowed < entity.maxAllowed) {
            const hasViolators = await this.roleConflictGroupRepository.hasAccountsViolatingRule({
                identifiers: entity.members.getItems().map((member) => member.role.id),
                maxAllowed: patch.maxAllowed,
                realm: entity.realm.id,
                transaction,
            });

            if (hasViolators) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.HAS_ACCOUNTS_VIOLATING_RULE` });
            }
        }

        entity.update({ patch });
    }

    public async revoke(props: Services.RoleConflictGroup.Revoke.Props): Services.RoleConflictGroup.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const entities = await this.roleConflictGroupRepository.find({
            where: { id: { $in: identifiers }, realm },
            transaction,
        });

        if (entities.length < identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.GROUPS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.revoke();
            }

            return entities;
        }
    }

    public async restore(props: Services.RoleConflictGroup.Restore.Props): Services.RoleConflictGroup.Restore.Result {
        const { transaction, identifiers, realm } = props;
        const entities = await this.roleConflictGroupRepository.find({
            where: { id: { $in: identifiers }, realm },
            transaction,
        });

        if (entities.length < identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.GROUPS_NOT_FOUND` });
        } else {
            const hasViolators = await this.roleConflictGroupRepository.hasGroupsWithViolatingAccounts({
                groups: entities.map((entity) => entity.id),
                transaction,
                realm,
            });

            if (hasViolators) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.HAS_ACCOUNTS_VIOLATING_RULE` });
            } else {
                for (const entity of entities) {
                    entity.restore();
                }

                return entities;
            }
        }
    }

    public async purge(props: Services.RoleConflictGroup.Purge.Props): Services.RoleConflictGroup.Purge.Result {
        const { transaction, identifiers, realm } = props;
        const entities = await this.roleConflictGroupRepository.find({
            where: { id: { $in: identifiers }, realm },
            transaction,
        });

        if (entities.length < identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.GROUPS_NOT_FOUND` });
        } else {
            transaction.clear();

            for (const entity of entities) {
                entity.canPurge();
                transaction.remove(entity);
            }

            return entities;
        }
    }
}
