import { EntityManager, Loaded, raw } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RealmAdapter } from "~context/infrastructure/adapters";
import { RepositoryException } from "~common/exceptions";
import { Realm } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RealmRepository extends RealmAdapter implements Repositories.Realm.Contract {
    private readonly resource = "Realm";

    public constructor(@InjectEntityManager("read") private readonly readManager: EntityManager) {
        super();
    }

    public async findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Realm.FindUnique<P, F>): Promise<Nullable<Loaded<Realm, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOne(Realm, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Realm.FindUniqueOrThrow<P, F>): Promise<Loaded<Realm, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager.fork();
            return await entityManager.findOneOrFail(Realm, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async findMany<P extends string = never, F extends string = "*">(
        props: Repositories.Realm.FindMany<P, F>,
    ): Promise<[Loaded<Realm, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findAndCount(Realm, where, options);
            } else {
                const { pagination, filters, sort, options } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters);
                const entityManager = this.readManager.fork();
                return await entityManager.findAndCount(Realm, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async getLookupList({ pagination, term }: Repositories.Realm.GetLookupList): Promise<[Realm[], number]> {
        try {
            const entityManager = this.readManager.fork();
            const builder = entityManager.createQueryBuilder(Realm, "r");

            builder
                .select(["r.id", "r.code", "r.name"])
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage);

            if (term) {
                builder.andWhere("r.name % ?", [term]).orderBy({
                    [raw("similarity(r.name, ?)", [term])]: "DESC",
                });
            } else {
                builder.orderBy({ "r.name": "ASC" });
            }

            return await builder.getResultAndCount();
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
