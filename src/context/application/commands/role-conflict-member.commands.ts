import { Inject, Injectable, Scope } from "@nestjs/common";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { ROLE_CONFLICT_MEMBER_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { CommandException } from "~common/exceptions";
import {
    ROLE_CONFLICT_MEMBER_REPOSITORY,
    ROLE_CONFLICT_GROUP_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberCommands implements Commands.RoleConflictMember.Contract {
    private readonly dictionaryPath = "commands.role-conflict-member";
    private readonly resource = "RoleConflictMember";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.InternalContract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.InternalContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.InternalContract,
        @Inject(ROLE_CONFLICT_MEMBER_SERVICE)
        private readonly roleConflictMemberService: Services.RoleConflictMember.Contract,
    ) {}

    public async create(props: Commands.RoleConflictMember.Create): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.CONFLICT_MEMBER,
                actionType: AccessControlActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input, realm } = props;
                const [roles, group] = await Promise.all([
                    this.roleRepository.find({
                        where: { id: { $in: input.roles }, realm },
                        transaction,
                    }),
                    this.roleConflictGroupRepository.findUniqueOrThrow({
                        where: { id: input.group, realm },
                        transaction,
                    }),
                ]);

                if (roles.length < input.roles.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                }

                await this.roleConflictMemberService.create({
                    input: { roles, group },
                    transaction,
                });

                return { message: `${this.dictionaryPath}.CREATED` };
            },
        });
    }

    public async purge(props: Commands.RoleConflictMember.Purge): Promise<MessageResult> {
        return await this.transactional.run({
            resource: this.resource,
            audit: {
                entityType: AccessControlEntityType.CONFLICT_MEMBER,
                actionType: AccessControlActionType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const { input } = props;
                const entities = await this.roleConflictMemberRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.MEMBERS_NOT_FOUND`);
                }

                this.roleConflictMemberService.purge({ transaction, entities });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            },
        });
    }
}
