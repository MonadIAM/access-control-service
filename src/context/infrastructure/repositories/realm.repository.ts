import { EntityManager, raw } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RealmAdapter } from "~context/infrastructure/adapters";
import { RepositoryException } from "~common/exceptions";
import { Realm } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

@Injectable({ scope: Scope.DEFAULT })
export class RealmRepository
    extends BaseRepository<Realm, Adapters.Realm.Types>({
        Adapter: RealmAdapter,
        Entity: Realm,
    })
    implements Repositories.Realm.InternalContract
{
    protected readonly realmLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.realmLimit = this.configService.getOrThrow<number>("REALM_LIMIT");
    }

    public async getLookupList({ pagination, realms, term }: Repositories.Realm.GetLookupList): Promise<[Realm[], number]> {
        try {
            const entityManager = this.readManager.fork();
            const builder = entityManager.createQueryBuilder(Realm, "r");

            builder
                .select(["r.id", "r.code", "r.name"])
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage);

            if (realms?.length) {
                builder.andWhere({ "r.id": { $in: realms } });
            }

            if (term) {
                builder.andWhere("r.name % ?", [term]).orderBy({
                    [raw("similarity(r.name, ?)", [term])]: "DESC",
                });
            } else {
                builder.orderBy({ "r.name": "ASC" });
            }

            return await builder.getResultAndCount();
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }

    public async wouldExceedRealmLimit({
        transaction,
        account,
        count,
    }: Repositories.Realm.WouldExceedRealmLimit): Promise<boolean> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            const knex = entityManager.getKnex();

            const [{ total }] = await knex("access_control.realm").where("owner", account).count("id as total");

            return Number(total) + (count ?? 1) > this.realmLimit;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }
}
