import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RoleConflictMemberAdapter } from "~context/infrastructure/adapters";
import { RoleConflictMember } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberRepository
    extends BaseRepository<Entities.RoleConflictMember, Adapters.RoleConflictMember.Types>({
        Adapter: RoleConflictMemberAdapter,
        Entity: RoleConflictMember,
    })
    implements Repositories.RoleConflictMember.InternalContract
{
    protected readonly membersLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.membersLimit = this.configService.getOrThrow<number>("MAX_CONFLICT_MEMBERS_COUNT");
    }

    public async wouldExceedMemberLimit({
        transaction,
        group,
        count,
    }: Repositories.RoleConflictMember.WouldExceedMemberLimit): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total }] = await knex("access_control.role_conflict_member")
                .where("group_id", group)
                .count("id as total");

            return Number(total) + count > this.membersLimit;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }
}
