import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RoleConflictMemberAdapter } from "~context/infrastructure/adapters";
import { RoleConflictMember } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleConflictMemberRepository
    extends RoleConflictMemberAdapter
    implements Repositories.RoleConflictMember.Contract
{
    private readonly resource = "RoleConflictMember";

    public constructor(
        @InjectEntityManager("read")
        private readonly readManager: EntityManager,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleConflictMember.FindUnique<P, F>): Promise<Nullable<Loaded<RoleConflictMember, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(RoleConflictMember, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.RoleConflictMember.FindUniqueOrThrow<P, F>): Promise<Loaded<RoleConflictMember, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(RoleConflictMember, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">(
        props: Repositories.RoleConflictMember.Find<P, F>,
    ): Promise<Loaded<RoleConflictMember, P, F>[]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(RoleConflictMember, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.RoleConflictMember.FindMany<P, F>,
    ): Promise<[Loaded<RoleConflictMember, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(RoleConflictMember, where, options);
            } else {
                const { pagination, filters, sort, options } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters);
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(RoleConflictMember, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async wouldExceedMemberLimit({
        transaction,
        group,
        count,
    }: Repositories.RoleConflictMember.WouldExceedMemberLimit): Promise<boolean> {
        try {
            const limit = this.configService.getOrThrow<number>("MAX_CONFLECT_MEMBERS_COUNT");
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total }] = await knex("access_control.role_conflict_member")
                .where("group_id", group)
                .count("id as total");

            return Number(total) + count > limit;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
