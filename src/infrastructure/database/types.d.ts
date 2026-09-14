import { AliasableExpression, SelectQueryBuilder, Compilable } from "kysely";
import { ConfigService } from "@nestjs/config";
import { Pool as PostgreSQLPool } from "pg";
import { StringValue } from "ms";
import {
    EntityDictionary as OriginEntityDictionary,
    EventSubscriber as OriginEventSubscriber,
    EntityMetadata as OriginEntityMetadata,
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
    UnitOfWork as OriginUnitOfWork,
    Collection as OriginCollection,
    EntityData as OriginEntityData,
    ChangeSet as OriginChangeSet,
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

        type QueryBuilder<D, T extends keyof D, O> = SelectQueryBuilder<D, T, O>;

        type ChangeSet<E extends OriginAnyEntity> = OriginChangeSet<E>;

        type Collection<E extends object> = OriginCollection<E>;

        type Query<O> = AliasableExpression<O> & Compilable<O>;

        type EntityDictionary<E> = OriginEntityDictionary<E>;

        type EntityMetadata<E> = OriginEntityMetadata<E>;

        type FindAllOptions<E> = OriginFindAllOptions<E>;

        type QueryOrderMap<E> = OriginQueryOrderMap<E>;

        type EventSubscriber = OriginEventSubscriber;

        type FlushEventArgs = OriginFlushEventArgs;

        type ObjectQuery<E> = OriginObjectQuery<E>;

        type EntityClass<E> = OriginEntityClass<E>;

        type FilterQuery<E> = OriginFilterQuery<E>;

        type EntityData<E> = OriginEntityData<E>;

        type ChangeSetType = OriginChangeSetType;

        type EntityManager = OriginEntityManager;

        type EntityKey<E> = OriginEntityKey<E>;

        type UnknownType = OriginUnknownType;

        type UnitOfWork = OriginUnitOfWork;

        type AnyEntity = OriginAnyEntity;

        type Options = OriginOptions;

        type RawColumnValue = Maybe<string | number | boolean | bigint | Date>;

        type CamelToSnakeCase<S extends string> = S extends `${infer Head}${infer Tail}`
            ? `${Head extends Uppercase<Head> ? "_" : ""}${Lowercase<Head>}${CamelToSnakeCase<Tail>}`
            : S;

        type Raw<E> = {
            [K in keyof E as E[K] extends RawColumnValue ? CamelToSnakeCase<K & string> : never]: E[K];
        };

        namespace ExternalChanges {
            namespace Record {
                type Props<Entity extends ORM.AnyEntity> = {
                    entityManager: ORM.FlushEventArgs["em"];
                    changes: ORM.ChangeSet<Entity>[];
                };

                type Result = void;

                type Signature = <Entity extends ORM.AnyEntity>(props: Props<Entity>) => Result;
            }

            namespace Drain {
                type Props = {
                    entityManager: ORM.FlushEventArgs["em"];
                };

                type Result = ORM.ChangeSet<ORM.AnyEntity>[];

                type Signature = (props: Props) => Result;
            }
        }

        type ForeignKeys<Entity> = {
            [
                Key in keyof Entity as Entity[Key] extends RawColumnValue
                    ? never
                    : Entity[Key] extends ORM.Collection<ORM.AnyEntity>
                      ? never
                      : Entity[Key] extends (...args: never[]) => unknown
                        ? never
                        : `${CamelToSnakeCase<Key & string>}_id`
            ]: string;
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

        type Columns<Entity> = Raw<Entity> & ForeignKeys<Entity>;

        type Database = {
            "system.inbox": Columns<SystemEntities.Inbox>;
            "access_control.role_permission_assignment": Columns<Entities.RolePermissionAssignment>;
            "access_control.account_role_assignment": Columns<Entities.AccountRoleAssignment>;
            "access_control.role_delegation_policy": Columns<Entities.RoleDelegationPolicy>;
            "access_control.role_conflict_group": Columns<Entities.RoleConflictGroup>;
            "access_control.role_conflict_member": Columns<Entities.RoleConflictMember>;
            "access_control.permission_override": Columns<Entities.PermissionOverride>;
            "access_control.role_closure": Columns<Entities.RoleClosure>;
            "access_control.permission": Columns<Entities.Permission>;
            "access_control.realm": Columns<Entities.Realm>;
            "access_control.role": Columns<Entities.Role>;
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
