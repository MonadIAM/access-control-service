import { EntityManager, FilterQuery, Loaded, raw, wrap } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RealmAdapter } from "~context/infrastructure/adapters";
import { RepositoryException } from "~common/exceptions";
import { Realm } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RealmRepository extends RealmAdapter implements Repositories.Realm.Contract {
    private readonly resource = "Realm";

    public constructor(
        @InjectEntityManager("write") private readonly writeManager: EntityManager,
        @InjectEntityManager("read") private readonly readManager: EntityManager,
    ) {
        super();
    }

    public async create({ transaction, entity }: Repositories.Realm.Create): Promise<Realm> {
        try {
            const entityManager = transaction ?? this.writeManager;

            entityManager.persist(entity);
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async update({ transaction, entity, patch }: Repositories.Realm.Update): Promise<Realm> {
        try {
            const entityManager = transaction ?? this.writeManager;

            wrap(entity).assign(patch, { merge: true });
            await entityManager.flush();

            return entity;
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async delete({ transaction, id }: Repositories.Realm.Delete): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager;
            const where: FilterQuery<Realm> = {
                isSystemManaged: false,
                isRevoked: true,
                id,
            };
            const affected = await entityManager.nativeDelete(Realm, where);
            if (!affected) {
                throw RepositoryException.notFound({ resource: this.resource });
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUnique<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Realm.FindUnique<P, F>): Promise<Nullable<Loaded<Realm, P, F>>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOne(Realm, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findUniqueOrThrow<P extends string = never, F extends string = "*">({
        transaction,
        options,
        where,
    }: Repositories.Realm.FindUniqueOrThrow<P, F>): Promise<Loaded<Realm, P, F>> {
        try {
            const entityManager = transaction ?? this.readManager;
            return entityManager.findOneOrFail(Realm, where, options);
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public findMany<P extends string = never, F extends string = "*">(
        props: Repositories.Realm.FindMany<P, F>,
    ): Promise<[Loaded<Realm, P, F>[], number]> {
        try {
            if ("where" in props) {
                const { transaction, options, where } = props;
                const entityManager = transaction ?? this.readManager.fork();
                return entityManager.findAndCount(Realm, where, options);
            } else {
                const { pagination, filters, sort, options } = props;
                const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                const where = super.buildWhereORM(filters);
                const entityManager = this.readManager.fork();
                return entityManager.findAndCount(Realm, where, opts);
            }
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async getLookupList({ pagination, term }: Repositories.Realm.GetLookupList): Promise<[Realm[], number]> {
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
    }
}
