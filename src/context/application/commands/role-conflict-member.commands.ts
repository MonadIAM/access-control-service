import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_MEMBER_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { EventType, EntityType } from "~context/enums";
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
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.InternalContract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.InternalContract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.InternalContract,
        @Inject(ROLE_CONFLICT_MEMBER_SERVICE)
        private readonly roleConflictMemberService: Services.RoleConflictMember.Contract,
    ) {}

    public async create(
        props: Commands.RoleConflictMember.Create.Props,
    ): Promise<Commands.RoleConflictMember.Create.Result> {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_MEMBER,
                actionType: EventType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
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
                } else {
                    await this.roleConflictMemberService.create({
                        input: { roles, group },
                        transaction,
                    });
                }
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async purge(props: Commands.RoleConflictMember.Purge.Props): Promise<Commands.RoleConflictMember.Purge.Result> {
        const { input } = props;

        const { count } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_MEMBER,
                actionType: EventType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleConflictMemberRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw CommandException.notFound(`${this.dictionaryPath}.MEMBERS_NOT_FOUND`);
                } else {
                    this.roleConflictMemberService.purge({ transaction, entities });
                    return { count: entities.length };
                }
            },
        });

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }
}
