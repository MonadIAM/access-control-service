import { ExceptionMapper } from "~common/exceptions";

export function BaseRepository<
    E extends ORM.AnyEntity,
    A extends Repositories.Mappers.Meta,
    C extends Class<Repositories.Mappers.Contract<E, A>> = Class<Repositories.Mappers.Contract<E, A>>,
>({ Entity, Mapper }: Repositories.Base.Mixin.Props<E, A, C>): Repositories.Base.Mixin.Result<E, A, C> {
    return class Mixin extends Mapper implements Repositories.Base.Contract<E, A> {
        declare protected readonly readManager: ORM.EntityManager;

        public readonly resource = Entity.name;

        public constructor(...args: AnyArray) {
            super(...args);
        }

        public async findUnique<P extends string = never, F extends string = "*">({
            transaction,
            options,
            where,
        }: Repositories.Base.FindUnique<E, P, F>): Promise<Nullable<ORM.Loaded<E, P, F>>> {
            try {
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findOne(Entity, where, options);
            } catch (error) {
                throw ExceptionMapper.fromORM(error, this.resource);
            }
        }

        public async findUniqueOrThrow<P extends string = never, F extends string = "*">({
            transaction,
            options,
            where,
        }: Repositories.Base.FindUniqueOrThrow<E, P, F>): Promise<ORM.Loaded<E, P, F>> {
            try {
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.findOneOrFail(Entity, where, options);
            } catch (error) {
                throw ExceptionMapper.fromORM(error, this.resource);
            }
        }

        public async find<P extends string = never, F extends string = "*">({
            transaction,
            options,
            where,
        }: Repositories.Base.Find<E, P, F>): Promise<ORM.Loaded<E, P, F>[]> {
            try {
                const entityManager = transaction ?? this.readManager.fork();
                return await entityManager.find(Entity, where, options);
            } catch (error) {
                throw ExceptionMapper.fromORM(error, this.resource);
            }
        }

        public async findMany<P extends string = never, F extends string = "*">(
            props: Repositories.Base.FindMany<E, A, P, F>,
        ): Promise<[ORM.Loaded<E, P, F>[], number]> {
            try {
                if ("where" in props) {
                    const { transaction, options, where } = props;
                    const entityManager = transaction ?? this.readManager.fork();
                    return await entityManager.findAndCount(Entity, where, options);
                } else {
                    const { pagination, filters, sort, options, prefilter } = props;
                    const opts = super.buildOptionsORM<P, F>(sort, pagination, options);
                    const where = super.buildWhereORM(filters, prefilter);
                    const entityManager = this.readManager.fork();
                    return await entityManager.findAndCount(Entity, where, opts);
                }
            } catch (error) {
                throw ExceptionMapper.fromORM(error, this.resource);
            }
        }
    };
}
