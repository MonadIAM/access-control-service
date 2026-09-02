declare namespace Repositories {
    namespace Base {
        namespace Mixin {
            type Props<
                E extends ORM.AnyEntity,
                A extends Repositories.Mappers.Meta,
                C extends Class<Repositories.Mappers.Contract<E, A>> = Class<Repositories.Mappers.Contract<E, A>>,
            > = {
                Entity: ORM.EntityClass<E>;
                Mapper: C;
            };

            type Result<E extends ORM.AnyEntity, A extends Repositories.Mappers.Meta, C extends Class> = C &
                Class<Contract<E, A>>;
        }

        interface Contract<E, A extends Repositories.Mappers.Meta> {
            readonly resource: string;

            find<P extends string = never, F extends string = "*">(props: Find<E, P, F>): Promise<ORM.Loaded<E, P, F>[]>;

            findUnique<P extends string = never, F extends string = "*">(
                props: FindUnique<E, P, F>,
            ): Promise<Nullable<ORM.Loaded<E, P, F>>>;

            findUniqueOrThrow<P extends string = never, F extends string = "*">(
                props: FindUniqueOrThrow<E, P, F>,
            ): Promise<ORM.Loaded<E, P, F>>;

            findMany<P extends string = never, F extends string = "*">(
                props: FindMany<E, A, P, F>,
            ): Promise<[ORM.Loaded<E, P, F>[], number]>;
        }

        type FindUnique<E, P extends string, F extends string> = {
            options?: ORM.FindOptions<E, P, F>;
            transaction?: ORM.EntityManager;
            where: ORM.FilterQuery<E>;
        };

        type FindUniqueOrThrow<E, P extends string, F extends string> = FindUnique<E, P, F>;

        type Find<E, P extends string, F extends string> = FindUnique<E, P, F>;

        type FindMany<E, A extends Repositories.Mappers.Meta, P extends string, F extends string> =
            | {
                  options?: ORM.FindOptions<E, P, F>;
                  transaction?: ORM.EntityManager;
                  where: ORM.FilterQuery<E>;
              }
            | {
                  options?: ORM.FindOptions<E, P, F>;
                  prefilter?: ORM.ObjectQuery<E>;
                  pagination: Pagination;
                  filters: A["Filters"];
                  sort: A["Sort"];
              };
    }
}
