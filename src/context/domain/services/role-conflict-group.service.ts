import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Exception } from "~common/exceptions";

import { RoleConflictGroup, RoleConflictMember } from "../entities";
import { ROLE_CONFLICT_GROUP_REPOSITORY } from "../repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupService implements Services.RoleConflictGroup.Contract {
    private readonly dictionaryPath = "services.role-conflict-group";
    private readonly membersLimit: number;

    public constructor(
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.PublicContract,
        private readonly configService: ConfigService,
    ) {
        this.membersLimit = this.configService.getOrThrow<number>("MAX_CONFLICT_MEMBERS_COUNT");
    }

    public async create(props: Services.RoleConflictGroup.Create.Props): Services.RoleConflictGroup.Create.Result {
        const { transaction, input, realm } = props;
        if (input.members.length > this.membersLimit) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.MEMBER_LIMIT_EXCEEDED` });
        } else {
            const limitExceeded = await this.roleConflictGroupRepository.wouldExceedGroupLimit({
                realm: realm.id,
                transaction,
            });

            if (limitExceeded) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.LIMIT_EXCEEDED` });
            } else {
                const hasViolators = await this.roleConflictGroupRepository.hasAccountsViolatingRule({
                    identifiers: input.members.map((role) => role.id),
                    maxAllowed: input.maxAllowed,
                    realm: realm.id,
                    transaction,
                });

                if (hasViolators) {
                    throw Exception.invariantViolation({
                        messageKey: `${this.dictionaryPath}.HAS_ACCOUNTS_VIOLATING_RULE`,
                    });
                } else {
                    const group = new RoleConflictGroup({
                        description: input.description,
                        maxAllowed: input.maxAllowed,
                        code: input.code,
                        name: input.name,
                        realm,
                    });

                    for (const role of input.members) {
                        transaction.persist(new RoleConflictMember({ group, role }));
                    }

                    transaction.persist(group);
                }
            }
        }
    }

    public async update(props: Services.RoleConflictGroup.Update.Props): Services.RoleConflictGroup.Update.Result {
        const { transaction, entity, patch } = props;

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

    public purge(props: Services.RoleConflictGroup.Purge.Props): Services.RoleConflictGroup.Purge.Result {
        const { transaction, entities } = props;
        transaction.clear();
        for (const entity of entities) {
            entity.canPurge();
            transaction.remove(entity);
        }
    }

    public revoke(props: Services.RoleConflictGroup.Revoke.Props): Services.RoleConflictGroup.Revoke.Result {
        const { entities } = props;
        for (const entity of entities) {
            entity.revoke();
        }
    }

    public async restore(props: Services.RoleConflictGroup.Restore.Props): Services.RoleConflictGroup.Restore.Result {
        const { transaction, entities, realm } = props;

        const hasViolators = await this.roleConflictGroupRepository.hasGroupsWithViolatingAccounts({
            groups: entities.map((entity) => entity.id),
            transaction,
            realm,
        });

        if (hasViolators) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.HAS_ACCOUNTS_VIOLATING_RULE` });
        }

        for (const entity of entities) {
            entity.restore();
        }
    }
}
