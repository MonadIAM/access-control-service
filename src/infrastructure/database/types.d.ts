import { Options as OriginOptions, IDatabaseDriver } from "@mikro-orm/core";
import { OperatorMap as OriginOperatorMap } from "@mikro-orm/core/typings";
import { ConfigService } from "@nestjs/config";
import {
    EventSubscriber as OriginEventSubscriber,
    FlushEventArgs as OriginFlushEventArgs,
    FindAllOptions as OriginFindAllOptions,
    QueryOrderMap as OriginQueryOrderMap,
    ChangeSetType as OriginChangeSetType,
    EntityManager as OriginEntityManager,
    FilterQuery as OriginFilterQuery,
    FindOptions as OriginFindOptions,
    ObjectQuery as OriginObjectQuery,
    EntityClass as OriginEntityClass,
    UnknownType as OriginUnknownType,
    Collection as OriginCollection,
    EntityKey as OriginEntityKey,
    AnyEntity as OriginAnyEntity,
    Loaded as OriginLoaded,
    Knex as OriginKnex,
} from "@mikro-orm/postgresql";

declare global {
    namespace ORM {
        type FindOptions<E, P extends string = never, F extends string = "*"> = OriginFindOptions<E, P, F>;

        type Loaded<E, P extends string = never, F extends string = "*"> = OriginLoaded<E, P, F>;

        type Options<D extends IDatabaseDriver> = OriginOptions<D>;

        type Collection<E extends object> = OriginCollection<E>;

        type FindAllOptions<E> = OriginFindAllOptions<E>;

        type QueryOrderMap<E> = OriginQueryOrderMap<E>;

        type EventSubscriber = OriginEventSubscriber;

        type QueryBuilder = OriginKnex.QueryBuilder;

        type FlushEventArgs = OriginFlushEventArgs;

        type OperatorMap<T> = OriginOperatorMap<T>;

        type ObjectQuery<E> = OriginObjectQuery<E>;

        type EntityClass<E> = OriginEntityClass<E>;

        type FilterQuery<E> = OriginFilterQuery<E>;

        type ChangeSetType = OriginChangeSetType;

        type EntityManager = OriginEntityManager;

        type JoinClause = OriginKnex.JoinClause;

        type EntityKey<E> = OriginEntityKey<E>;

        type UnknownType = OriginUnknownType;

        type AnyEntity = OriginAnyEntity;

        type ConnectionKind = "write" | "read";

        namespace Config {
            namespace ResolveHost {
                type Props = {
                    kind: ORM.ConnectionKind;
                    config: ConfigService;
                    cqrsEnabled: boolean;
                };
            }

            namespace ResolvePort {
                type Props = {
                    kind: ORM.ConnectionKind;
                    config: ConfigService;
                    cqrsEnabled: boolean;
                };
            }

            namespace ResolvePool {
                type Props = {
                    kind: ORM.ConnectionKind;
                    config: ConfigService;
                    cqrsEnabled: boolean;
                };
                type Result = {
                    idleTimeoutMillis: number;
                    max: number;
                };
            }
        }
    }
}
