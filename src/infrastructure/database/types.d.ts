import { ConfigService } from "@nestjs/config";
import { Pool as PostgreSQLPool } from "pg";
import { StringValue } from "ms";
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

        type PoolStats = {
            kind: ConnectionKind;
            waiting: number;
            active: number;
            total: number;
            idle: number;
            max: number;
        };

        namespace Config {
            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                buildOptions: BuildOptions.Signature;
            }

            namespace BuildOptions {
                type Props = {
                    kind?: ORM.ConnectionKind;
                    config: ConfigService;
                };

                type Result = ORM.Options;

                type Signature = (props: Props) => Result;
            }

            interface InternalContract {
                buildDriverOptions: BuildDriverOptions.Signature;
                resolvePoolIdleMS: ResolvePoolIdleMS.Signature;
                buildPoolOptions: BuildPoolOptions.Signature;
                resolvePoolMax: ResolvePoolMax.Signature;
                resolvePort: ResolvePort.Signature;
                resolveHost: ResolveHost.Signature;
            }

            namespace ResolveHost {
                type Props = {
                    kind: ORM.ConnectionKind;
                    config: ConfigService;
                };

                type Result = string;

                type Signature = (props: Props) => Result;
            }

            namespace ResolvePort {
                type Props = {
                    kind: ORM.ConnectionKind;
                    config: ConfigService;
                };

                type Result = number;

                type Signature = (props: Props) => Result;
            }

            namespace ResolvePoolMax {
                type Props = {
                    kind: ORM.ConnectionKind;
                    config: ConfigService;
                };

                type Result = number;

                type Signature = (props: Props) => Result;
            }

            namespace ResolvePoolIdleMS {
                type Props = {
                    kind: ORM.ConnectionKind;
                    config: ConfigService;
                };

                type Result = StringValue;

                type Signature = (props: Props) => Result;
            }

            namespace BuildPoolOptions {
                type Props = {
                    kind: ORM.ConnectionKind;
                    config: ConfigService;
                };

                type Result = ORM.Options["pool"];

                type Signature = (props: Props) => Result;
            }

            namespace BuildDriverOptions {
                type Props = {
                    kind: ORM.ConnectionKind;
                    config: ConfigService;
                    host: string;
                };

                type Result = ORM.Options["driverOptions"];

                type Signature = (props: Props) => Result;
            }
        }

        namespace PoolRegistry {
            interface Contract extends PublicContract, InternalContract {}

            interface InternalContract {
                register: Register.Signature;
            }

            namespace Register {
                type Props = {
                    kind: ORM.ConnectionKind;
                    pool: PostgreSQLPool;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            interface PublicContract {
                snapshots: Snapshots.Signature;
                snapshot: Snapshot.Signature;
            }

            namespace Snapshot {
                type Props = {
                    kind: ORM.ConnectionKind;
                };

                type Result = Nullable<ORM.PoolStats>;

                type Signature = (props: Props) => Result;
            }

            namespace Snapshots {
                type Result = ORM.PoolStats[];

                type Signature = () => Result;
            }
        }
    }
}
