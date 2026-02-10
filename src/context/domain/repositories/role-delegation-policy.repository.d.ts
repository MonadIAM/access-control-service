import { EntityManager, FilterQuery, FindOptions, EntityData, Loaded, QueryOrder } from "@mikro-orm/postgresql";

import { OrdinalFilterDTO, StringFilterDTO, LinkFilterDTO } from "~common/dto";

import { RoleDelegationPolicy as RoleDelegationPolicyEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RoleDelegationPolicy {
            type Entity = RoleDelegationPolicyEntity;

            interface Contract {
                create: (props: Create) => Promise<Entity>;
                update: (props: Update) => Promise<Entity>;
                delete: (props: Delete) => Promise<void>;
                bulkUpdate: (props: BulkUpdate) => Promise<Entity[]>;
                bulkDelete: (props: BulkDelete) => Promise<number>;

                findUnique: <P extends string = never, F extends string = "*">(
                    props: FindUnique<P, F>,
                ) => Promise<Nullable<Loaded<Entity, P, F>>>;

                findUniqueOrThrow: <P extends string = never, F extends string = "*">(
                    props: FindUniqueOrThrow<P, F>,
                ) => Promise<Loaded<Entity, P, F>>;

                findMany: <P extends string = never, F extends string = "*">(
                    props: FindMany<P, F>,
                ) => Promise<[Loaded<Entity, P, F>[], number]>;

                existsTransitivePath: (props: ExistsTransitivePath) => Promise<boolean>;
                isDelegationAllowed: (props: IsDelegationAllowed) => Promise<boolean>;
                isUpwardGrant: (props: IsUpwardGrant) => Promise<boolean>;
            }

            type Create = {
                transaction?: EntityManager;
                entity: Entity;
            };

            type Update = {
                transaction?: EntityManager;
                patch: Partial<EntityData<Entity>>;
                entity: Entity;
            };

            type Delete = {
                transaction?: EntityManager;
                realm: string;
                id: string;
            };

            type BulkUpdate = {
                transaction?: EntityManager;
                updates: {
                    patch: Partial<EntityData<Entity>>;
                    entity: Entity;
                }[];
            };

            type BulkDelete = {
                transaction?: EntityManager;
                realm: string;
            } & ({ identifiers: string[]; delegatorRole?: never } | { delegatorRole: string; identifiers?: never });

            type FindUnique<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type FindUniqueOrThrow<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type FindMany<P extends string, F extends string> =
                | {
                      transaction?: EntityManager;
                      options?: FindOptions<Entity, P, F>;
                      where: FilterQuery<Entity>;
                  }
                | {
                      pagination: Pagination;
                      filters: Filters;
                      sort: Sort;
                      realm: string;
                      options?: FindOptions<Entity, P, F>;
                  };

            type ExistsTransitivePath = {
                transaction?: EntityManager;
                from: string;
                to: string | string[];
            };

            type IsDelegationAllowed = {
                transaction?: EntityManager;
                delegatorRole: string | string[];
                targetRole: string;
            };

            type IsUpwardGrant = {
                transaction?: EntityManager;
                delegatorRole: string[];
                targetRole: string;
            };

            type Filters = {
                id?: StringFilterDTO;
                isSystemManaged?: boolean;
                depthLimit?: OrdinalFilterDTO<number>;
                realm?: LinkFilterDTO;
                delegator?: LinkFilterDTO;
                target?: LinkFilterDTO;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                isRevoked?: boolean;
            };

            type Sort = {
                createdAt?: QueryOrder;
            };
        }
    }
}
