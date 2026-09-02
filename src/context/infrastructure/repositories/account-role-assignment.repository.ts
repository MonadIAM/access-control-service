import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AccountRoleAssignment } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { AccountRoleAssignmentMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class AccountRoleAssignmentRepository
    extends BaseRepository<Entities.AccountRoleAssignment, Repositories.Mappers.AccountRoleAssignment.Types>({
        Mapper: AccountRoleAssignmentMapper,
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

            const [total, overlap] = await Promise.all([
                entityManager.count(AccountRoleAssignment, { account, isRevoked: false }),
                entityManager.count(AccountRoleAssignment, { account, isRevoked: false, role: { $in: roles } }),
            ]);

            return total + roles.length - overlap > this.accountRoleLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
