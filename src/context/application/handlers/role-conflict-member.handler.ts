import { Inject, Injectable, Scope } from "@nestjs/common";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";

import { ROLE_CONFLICT_MEMBER_SERVICE } from "~context/domain/services";
import { HandlerException } from "~common/exceptions";
import {
    ROLE_CONFLICT_MEMBER_REPOSITORY,
    ROLE_CONFLICT_GROUP_REPOSITORY,
    REALM_REPOSITORY,
    ROLE_REPOSITORY,
} from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberHandler implements Handlers.RoleConflictMember.Contract {
    private readonly dictionaryPath = "handlers.role-conflict-member";
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
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.Contract,
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.Contract,
    ) {}

    public async create({
        input: { roles, group },
        context,
        actor,
        realm,
    }: Handlers.RoleConflictMember.Create): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const [groupEntity, realmEntity, roleEntities] = await Promise.all([
                    this.roleConflictGroupRepository.findUniqueOrThrow({
                        where: { id: group },
                        transaction,
                    }),
                    this.realmRepository.findUniqueOrThrow({
                        where: { id: realm },
                        transaction,
                    }),
                    this.roleRepository.find({
                        where: { id: { $in: roles } },
                        transaction,
                    }),
                ]);

                if (roleEntities.length < roles.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.ROLES_NOT_FOUND`);
                }

                await this.roleConflictMemberService.create({
                    input: {
                        roles: roleEntities,
                        group: groupEntity,
                    },
                    realm: realmEntity,
                    transaction,
                    context,
                    actor,
                });

                return { message: `${this.dictionaryPath}.CREATED` };
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }

    public async purge({
        input: { identifiers, reason },
        context,
        actor,
        realm,
    }: Handlers.RoleConflictMember.Purge): Promise<MessageResult> {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                const entities = await this.roleConflictMemberRepository.find({
                    where: { id: { $in: identifiers } },
                    transaction,
                });

                if (entities.length < identifiers.length) {
                    throw HandlerException.notFound(`${this.dictionaryPath}.MEMBERS_NOT_FOUND`);
                }

                await this.roleConflictMemberService.purge({
                    transaction,
                    entities,
                    context,
                    reason,
                    actor,
                    realm,
                });

                if (entities.length > 1) {
                    return { message: `${this.dictionaryPath}.BULK_PURGED_COUNT`, params: { count: entities.length } };
                } else {
                    return { message: `${this.dictionaryPath}.PURGED` };
                }
            });
        } catch (error) {
            throw HandlerException.fromOrmError(error, this.resource);
        }
    }
}
