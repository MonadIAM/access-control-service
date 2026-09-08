import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { raw } from "@mikro-orm/postgresql";

import { ExceptionMapper } from "~common/exceptions";
import { Realm } from "~context/domain/entities";
import { BaseRepository } from "~common/mixins";

import { RealmMapper } from "../mappers";

@Injectable({ scope: Scope.DEFAULT })
export class RealmRepository
    extends BaseRepository<Entities.Realm, Repositories.Mappers.Realm.Types>({
        Mapper: RealmMapper,
        Entity: Realm,
    })
    implements Repositories.Realm.Contract
{
    protected readonly realmLimit: number;

    public constructor(
        @InjectEntityManager("read")
        protected readonly readManager: ORM.EntityManager,
        protected readonly configService: ConfigService,
    ) {
        super();
        this.realmLimit = this.configService.getOrThrow<number>("REALM_LIMIT");
    }

    public async getLookupList(props: Repositories.Realm.GetLookupList.Props): Repositories.Realm.GetLookupList.Result {
        try {
            const { pagination, realms, term } = props;
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
                builder
                    .andWhere("r.name % ?", [term])
                    .orderBy([{ [raw("similarity(r.name, ?)", [term])]: "DESC" }, { "r.name": "ASC" }, { "r.id": "ASC" }]);
            } else {
                builder.orderBy({ "r.name": "ASC", "r.id": "ASC" });
            }

            return await builder.getResultAndCount();
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async wouldExceedRealmLimit(
        props: Repositories.Realm.WouldExceedRealmLimit.Props,
    ): Repositories.Realm.WouldExceedRealmLimit.Result {
        try {
            const { transaction, account, count } = props;
            const entityManager = transaction ?? this.readManager.fork();
            const total = await entityManager.count(Realm, { owner: account });

            return total + (count ?? 1) > this.realmLimit;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
