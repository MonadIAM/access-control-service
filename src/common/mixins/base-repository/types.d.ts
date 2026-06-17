import {
    EntityManager,
    FilterQuery,
    FindOptions,
    ObjectQuery,
    EntityClass,
    AnyEntity,
    Loaded,
} from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace Base {
            namespace Mixin {
                type Props<
                    E extends AnyEntity,
                    A extends Adapters.Meta,
                    C extends Class<Adapters.Contract<E, A>> = Class<Adapters.Contract<E, A>>,
                > = {
                    Entity: EntityClass<E>;
                    Adapter: C;
                };

                type Result<E extends AnyEntity, A extends Adapters.Meta, C extends Class> = C & Class<Contract<E, A>>;
            }

            interface Contract<E, A extends Adapters.Meta> {
                find<P extends string = never, F extends string = "*">(props: Find<E, P, F>): Promise<Loaded<E, P, F>[]>;

                findUnique<P extends string = never, F extends string = "*">(
                    props: FindUnique<E, P, F>,
                ): Promise<Nullable<Loaded<E, P, F>>>;

                findUniqueOrThrow<P extends string = never, F extends string = "*">(
                    props: FindUniqueOrThrow<E, P, F>,
                ): Promise<Loaded<E, P, F>>;

                findMany<P extends string = never, F extends string = "*">(
                    props: FindMany<E, A, P, F>,
                ): Promise<[Loaded<E, P, F>[], number]>;
            }

            type FindUnique<E, P extends string, F extends string> = {
                options?: FindOptions<E, P, F>;
                transaction?: EntityManager;
                where: FilterQuery<E>;
            };

            type FindUniqueOrThrow<E, P extends string, F extends string> = FindUnique<E, P, F>;

            type Find<E, P extends string, F extends string> = FindUnique<E, P, F>;

            type FindMany<E, A extends Adapters.Meta, P extends string, F extends string> =
                | {
                      options?: FindOptions<E, P, F>;
                      transaction?: EntityManager;
                      where: FilterQuery<E>;
                  }
                | {
                      options?: FindOptions<E, P, F>;
                      prefilter?: ObjectQuery<E>;
                      pagination: Pagination;
                      filters: A["Filters"];
                      sort: A["Sort"];
                  };
        }
    }
}
