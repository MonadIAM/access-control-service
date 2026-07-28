import { ConfigService } from "@nestjs/config";
import { Knex } from "knex";
import {
    EntityDictionary as OriginEntityDictionary,
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
    Options as OriginOptions,
    Loaded as OriginLoaded,
} from "@mikro-orm/postgresql";

declare global {
    namespace Temporal {
        class Duration {}
    }

    namespace ORM {
        type FindOptions<E, P extends string = never, F extends string = "*"> = OriginFindOptions<E, P, F>;

        type Loaded<E, P extends string = never, F extends string = "*"> = OriginLoaded<E, P, F>;

        type Collection<E extends object> = OriginCollection<E>;

        type EntityDictionary<E> = OriginEntityDictionary<E>;

        type FindAllOptions<E> = OriginFindAllOptions<E>;

        type QueryOrderMap<E> = OriginQueryOrderMap<E>;

        type EventSubscriber = OriginEventSubscriber;

        type FlushEventArgs = OriginFlushEventArgs;

        type ObjectQuery<E> = OriginObjectQuery<E>;

        type EntityClass<E> = OriginEntityClass<E>;

        type FilterQuery<E> = OriginFilterQuery<E>;

        type ChangeSetType = OriginChangeSetType;

        type EntityManager = OriginEntityManager;

        type EntityKey<E> = OriginEntityKey<E>;

        type QueryBuilder = Knex.QueryBuilder;

        type UnknownType = OriginUnknownType;

        type JoinClause = Knex.JoinClause;

        type AnyEntity = OriginAnyEntity;

        type Options = OriginOptions;

        type RawColumnValue = Maybe<string | number | boolean | bigint | Date>;

        type CamelToSnakeCase<S extends string> = S extends `${infer Head}${infer Tail}`
            ? `${Head extends Uppercase<Head> ? "_" : ""}${Lowercase<Head>}${CamelToSnakeCase<Tail>}`
            : S;

        type Raw<E> = {
            [K in keyof E as E[K] extends RawColumnValue ? CamelToSnakeCase<K & string> : never]: E[K];
        };

        type OperatorMap<T> = {
            $nin?: readonly T[];
            $in?: readonly T[];
            $ilike?: string;
            $like?: string;
            $gte?: T;
            $lte?: T;
            $gt?: T;
            $lt?: T;
            $eq?: T;
            $ne?: T;
        };

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
