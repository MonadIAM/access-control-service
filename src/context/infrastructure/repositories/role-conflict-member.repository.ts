import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RoleConflictMember } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { RoleConflictMemberMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberRepository
    extends BaseRepository<Entities.RoleConflictMember, Repositories.Mappers.RoleConflictMember.Types>({
        Mapper: RoleConflictMemberMapper,
        Entity: RoleConflictMember,
    })
    implements Repositories.RoleConflictMember.Contract
{
    protected readonly membersLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.membersLimit = this.configService.getOrThrow<number>("MAX_CONFLICT_MEMBERS_COUNT");
    }

    public async wouldExceedMemberLimit(
        props: Repositories.RoleConflictMember.WouldExceedMemberLimit.Props,
    ): Repositories.RoleConflictMember.WouldExceedMemberLimit.Result {
        try {
            const { transaction, group, count } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const total = await entityManager.count(RoleConflictMember, { group });

            return total + count > this.membersLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
