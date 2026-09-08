import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PermissionOverride } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

import { PermissionOverrideMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideRepository
    extends BaseRepository<Entities.PermissionOverride, Repositories.Mappers.PermissionOverride.Types>({
        Mapper: PermissionOverrideMapper,
        Entity: PermissionOverride,
    })
    implements Repositories.PermissionOverride.Contract
{
    protected readonly overrideLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.overrideLimit = this.configService.getOrThrow<number>("PERMISSION_OVERRIDE_PER_ACCOUNT_LIMIT");
    }

    public async wouldExceedOverrideLimit(
        props: Repositories.PermissionOverride.WouldExceedOverrideLimit.Props,
    ): Repositories.PermissionOverride.WouldExceedOverrideLimit.Result {
        try {
            const { transaction, account, realm, count } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const total = await entityManager.count(PermissionOverride, {
                $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
                isRevoked: false,
                account,
                realm,
            });

            return total + (count ?? 1) > this.overrideLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
