import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { ROLE_CONFLICT_MEMBER_SERVICE } from "~context/domain/services";
import { OperationException } from "~common/exceptions";
import {
    ROLE_CONFLICT_MEMBER_REPOSITORY,
    ROLE_CONFLICT_GROUP_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";
import { AuditJournal } from "~context/domain/entities";
import { AccessControlActionType, AccessControlEntityType } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberOperation implements Operations.RoleConflictMember.Contract {
    private readonly entityType = AccessControlEntityType.CONFLICT_MEMBER;
    private readonly dictionaryPath = "operations.role-conflict-member";
    private readonly resource = "RoleConflictMember";

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        @Inject(ROLE_CONFLICT_MEMBER_REPOSITORY)
        private readonly roleConflictMemberRepository: Repositories.RoleConflictMember.Contract,
        @Inject(ROLE_CONFLICT_GROUP_REPOSITORY)
        private readonly roleConflictGroupRepository: Repositories.RoleConflictGroup.Contract,
        @Inject(ROLE_CONFLICT_MEMBER_SERVICE)
        private readonly roleConflictMemberService: Services.RoleConflictMember.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
    ) {}

    public async create({ context, input, realm, actor }: Operations.RoleConflictMember.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const [roleEntities, groupEntity] = await Promise.all([
                    this.roleRepository.find({
                        where: { id: { $in: input.roles }, realm },
                        transaction,
                    }),
                    this.roleConflictGroupRepository.findUniqueOrThrow({
                        where: { id: input.group, realm },
                        transaction,
                    }),
                ]);

                if (roleEntities.length < input.roles.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                }

                await this.roleConflictMemberService.create({
                    input: {
                        roles: roleEntities,
                        group: groupEntity,
                    },
                    transaction,
                    actor,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.CREATE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                return { message: `${this.dictionaryPath}.CREATED` };
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }

    public async purge({ context, input, realm, actor }: Operations.RoleConflictMember.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleConflictMemberRepository.find({
                    where: { id: { $in: input.identifiers } },
                    transaction,
                });

                if (entities.length < input.identifiers.length) {
                    throw OperationException.notFound(`${this.dictionaryPath}.MEMBERS_NOT_FOUND`);
                }

                this.roleConflictMemberService.purge({
                    input: { reason: input.reason, entities },
                    transaction,
                });

                transaction.persist(
                    new AuditJournal({
                        actionType: AccessControlActionType.DELETE,
                        entityType: this.entityType,
                        ...context,
                        actor,
                        realm,
                        input,
                    }),
                );

                await transaction.flush();

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            });
        } catch (error) {
            throw OperationException.fromOrmError(error, this.resource);
        }
    }
}
