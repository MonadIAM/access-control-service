import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PermissionOverrideAdapter } from "~context/infrastructure/adapters";
import { PermissionOverride } from "~context/domain/entities";
import { RepositoryException } from "~common/exceptions";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideRepository
    extends BaseRepository<PermissionOverride, Adapters.PermissionOverride.Types>({
        Adapter: PermissionOverrideAdapter,
        Entity: PermissionOverride,
    })
    implements Repositories.PermissionOverride.InternalContract
{
    protected readonly overrideLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.overrideLimit = this.configService.getOrThrow<number>("PERMISSION_OVERRIDE_PER_ACCOUNT_LIMIT");
    }

    public async wouldExceedOverrideLimit({
        transaction,
        account,
        realm,
        count,
    }: Repositories.PermissionOverride.WouldExceedOverrideLimit): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total }] = await knex("access_control.permission_override")
                .where("account", account)
                .andWhere("realm_id", realm)
                .andWhere("is_revoked", false)
                .count("id as total");

            return Number(total) + (count ?? 1) > this.overrideLimit;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }
}
