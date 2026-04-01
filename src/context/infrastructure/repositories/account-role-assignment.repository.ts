import { EntityManager, Loaded } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AccountRoleAssignmentAdapter } from "~context/infrastructure/adapters";
import { AccountRoleAssignment } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentRepository
    extends AccountRoleAssignmentAdapter
    implements Repositories.AccountRoleAssignment.ExternalContract, Repositories.AccountRoleAssignment.InternalContract
{
    private readonly resource = "AccountRoleAssignment";
    private readonly accountRoleLimit: number;

    public constructor(
        @InjectEntityManager("read")
        private readonly readManager: EntityManager,
        private readonly configService: ConfigService,
    ) {
        super();
        this.accountRoleLimit = this.configService.getOrThrow<number>("ROLE_PER_ACCOUNT_LIMIT");
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AccountRoleAssignment.FindUnique<P, F>): Promise<Nullable<Loaded<AccountRoleAssignment, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(AccountRoleAssignment, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.AccountRoleAssignment.FindUniqueOrThrow<P, F>): Promise<Loaded<AccountRoleAssignment, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(AccountRoleAssignment, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async find<P extends string = never, F extends string = "*">(
        props: Repositories.AccountRoleAssignment.Find<P, F>,
    ): Promise<Loaded<AccountRoleAssignment, P, F>[]> {
        try {
            const { transaction, options, where } = props;
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.find(AccountRoleAssignment, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.AccountRoleAssignment.FindMany<P, F>,
    ): Promise<[Loaded<AccountRoleAssignment, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(AccountRoleAssignment, where, options);
            } else {
                const { pagination, filters, sort, options, realm } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters, { realm });
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(AccountRoleAssignment, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async wouldExceedRoleLimit({
        transaction,
        account,
        roles,
    }: Repositories.AccountRoleAssignment.WouldExceedRoleLimit): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total, overlap }] = await knex("access_control.account_role_assignment")
                .where("account", account)
                .andWhere("is_revoked", false)
                .select(
                    knex.raw("COUNT(*)::int AS total"),
                    knex.raw("COUNT(*) FILTER (WHERE role_id = ANY(?))::int AS overlap", [roles]),
                );

            return Number(total) + roles.length - Number(overlap) > this.accountRoleLimit;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
