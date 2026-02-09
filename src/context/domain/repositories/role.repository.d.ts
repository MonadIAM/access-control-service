import { EntityManager, FilterQuery, FindOptions, EntityData, QueryOrder, Loaded, EntityKey } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";
import { DelegatorType } from "~context/enums";

import { RoleClosure as RoleClosureEntity, Role as RoleEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Role {
            type Entity = RoleEntity;
            type DepthEntity = Entity & { depth: number };

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

                getAncestors: (props: GetAncestors) => Promise<Entity[]>;
                findAncestors: (props: FindAncestors) => Promise<[DepthEntity[], number]>;

                getDescendants: (props: GetDescendants) => Promise<Entity[]>;
                findDescendants: (props: FindDescendants) => Promise<[DepthEntity[], number]>;

                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;

                findDelegateableRoles: (props: FindDelegateableRoles) => Promise<[Entity[], number]>;

                findEffectiveRoles: (props: FindEffectiveRoles) => Promise<[Entity[], number]>;

                getHierarchyGraph: (props: GetHierarchyGraph) => Promise<Graph.Data>;
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
                identifiers: string[];
                realm: string;
            };

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

            type GetAncestors = {
                descendant: string;
                transaction?: EntityManager;
                options?: FindOptions<RoleClosureEntity>;
                where: FilterQuery<Entity>;
                depth?: number;
            };

            type FindAncestors = {
                populate: readonly EntityKey<Entity>[];
                descendant: string;
                pagination: Pagination;
                filters: Filters;
            };

            type GetDescendants = {
                ancestor: string;
                transaction?: EntityManager;
                options?: FindOptions<RoleClosureEntity>;
                where?: FilterQuery<Entity>;
                depth?: number;
            };

            type FindDescendants = {
                populate: readonly EntityKey<Entity>[];
                ancestor: string;
                pagination: Pagination;
                filters: Filters;
            };

            type GetLookupList = {
                pagination: Pagination;
                realm: string;
                term: string;
            };

            type FindDelegateableRoles = {
                where: {
                    type: DelegatorType;
                    realm: string;
                    id: string;
                };
                pagination: Pagination;
                filters: Filters;
                sort: Sort;
            };

            type FindEffectiveRoles = {
                where: {
                    account: string;
                    realm: string;
                };
                pagination: Pagination;
                filters: Filters;
                sort: Sort;
            };

            type GetHierarchyGraph = {
                transaction?: EntityManager;
                realm: string;
            };

            type Filters = {
                id?: StringFilterDTO;
                code?: StringFilterDTO;
                name?: StringFilterDTO;
                permission?: LinkFilterDTO;
                actorType?: StringFilterDTO;
                protoType?: StringFilterDTO;
                createdAt?: OrdinalFilterDTO<Date>;
                nonDelegable?: boolean;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type Sort = {
                createdAt?: QueryOrder;
            };

            namespace Graph {
                type Node = {
                    id: string;
                    label: string;
                    attributes: {
                        code: string;
                        protoType: string;
                        isRevoked: boolean;
                    };
                };

                type Edge = {
                    id: string;
                    source: string;
                    target: string;
                };

                type Data = {
                    nodes: Node[];
                    edges: Edge[];
                };
            }
        }
    }
}
