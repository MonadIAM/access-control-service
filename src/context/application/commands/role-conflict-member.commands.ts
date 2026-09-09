import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_MEMBER_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ActionType, EntityType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberCommands implements Commands.RoleConflictMember.Contract {
    private readonly dictionaryPath = "commands.role-conflict-member";
    private readonly resource = "RoleConflictMember";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ROLE_CONFLICT_MEMBER_SERVICE)
        private readonly roleConflictMemberService: Services.RoleConflictMember.CommandContract,
    ) {}

    public async create(props: Commands.RoleConflictMember.Create.Props): Commands.RoleConflictMember.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_MEMBER,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.roleConflictMemberService.create({ transaction, realm, input });
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async purge(props: Commands.RoleConflictMember.Purge.Props): Commands.RoleConflictMember.Purge.Result {
        const { input, realm } = props;

        const { count } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_MEMBER,
                actionType: ActionType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleConflictMemberService.purge({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });

                return { count: entities.length };
            },
        });

        if (count > 1) {
            return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count } };
        } else {
            return { message: `${this.dictionaryPath}.PURGED` };
        }
    }
}
