import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_CONFLICT_GROUP_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { ActionType, EntityType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictGroupCommands implements Commands.RoleConflictGroup.Contract {
    private readonly dictionaryPath = "commands.role-conflict-group";
    private readonly resource = "RoleConflictGroup";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.PublicContract,
        @Inject(ROLE_CONFLICT_GROUP_SERVICE)
        private readonly roleConflictGroupService: Services.RoleConflictGroup.CommandContract,
    ) {}

    public async create(props: Commands.RoleConflictGroup.Create.Props): Commands.RoleConflictGroup.Create.Result {
        const { input, realm } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_GROUP,
                actionType: ActionType.CREATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.roleConflictGroupService.create({ transaction, realm, input });
            },
        });

        return { message: `${this.dictionaryPath}.CREATED` };
    }

    public async update(props: Commands.RoleConflictGroup.Update.Props): Commands.RoleConflictGroup.Update.Result {
        const { input, realm, id } = props;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_GROUP,
                actionType: ActionType.UPDATE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                await this.roleConflictGroupService.update({ patch: input.patch, transaction, realm, id });
            },
        });

        return { message: `${this.dictionaryPath}.UPDATED` };
    }

    public async revoke(props: Commands.RoleConflictGroup.Revoke.Props): Commands.RoleConflictGroup.Revoke.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_GROUP,
                actionType: ActionType.REVOKE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                return await this.roleConflictGroupService.revoke({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_REVOKED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.REVOKED` };
        }
    }

    public async restore(props: Commands.RoleConflictGroup.Restore.Props): Commands.RoleConflictGroup.Restore.Result {
        const { input, realm } = props;

        const entities = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_GROUP,
                actionType: ActionType.RESTORE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                return await this.roleConflictGroupService.restore({
                    identifiers: input.identifiers,
                    transaction,
                    realm,
                });
            },
        });

        if (entities.length > 1) {
            return { message: `${this.dictionaryPath}.BULK_RESTORED_COUNT`, params: { count: entities.length } };
        } else {
            return { message: `${this.dictionaryPath}.RESTORED` };
        }
    }

    public async purge(props: Commands.RoleConflictGroup.Purge.Props): Commands.RoleConflictGroup.Purge.Result {
        const { input, realm } = props;

        const { count } = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.CONFLICT_GROUP,
                actionType: ActionType.DELETE,
                ...props,
            },
            changeLog: true,
            execute: async (transaction) => {
                const entities = await this.roleConflictGroupService.purge({
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
