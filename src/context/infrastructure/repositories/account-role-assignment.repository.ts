import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AccountRoleAssignmentAdapter } from "~context/infrastructure/adapters";
import { AccountRoleAssignment } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentRepository
    extends BaseRepository<Entities.AccountRoleAssignment, Adapters.AccountRoleAssignment.Types>({
        Adapter: AccountRoleAssignmentAdapter,
        Entity: AccountRoleAssignment,
    })
    implements Repositories.AccountRoleAssignment.Contract
{
    protected readonly accountRoleLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.accountRoleLimit = this.configService.getOrThrow<number>("ROLE_PER_ACCOUNT_LIMIT");
    }

    public async wouldExceedRoleLimit(
        props: Repositories.AccountRoleAssignment.WouldExceedRoleLimit.Props,
    ): Repositories.AccountRoleAssignment.WouldExceedRoleLimit.Result {
        try {
            const { transaction, account, roles } = props;
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
            throw ExceptionMapper.fromORM(error, this.constructor.name);
        }
    }
}
