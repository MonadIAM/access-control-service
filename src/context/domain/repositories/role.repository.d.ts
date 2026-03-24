import { EntityManager, FilterQuery, FindOptions, QueryOrder, Loaded, EntityKey } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";
import { DelegatorType } from "~context/enums";

import { RoleClosure as RoleClosureEntity, Role as RoleEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Role {
            type Entity = RoleEntity;
            type DepthEntity = Entity & { depth: number };

            interface Contract {
                findUnique: <P extends string = never, F extends string = "*">(
                    props: FindUnique<P, F>,
                ) => Promise<Nullable<Loaded<Entity, P, F>>>;

                findUniqueOrThrow: <P extends string = never, F extends string = "*">(
                    props: FindUniqueOrThrow<P, F>,
                ) => Promise<Loaded<Entity, P, F>>;

                find: <P extends string = never, F extends string = "*">(
                    props: Find<P, F>,
                ) => Promise<Loaded<Entity, P, F>[]>;

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

                findAccountsByRoles: (props: FindAccountsByRoles) => Promise<string[]>;

                wouldExceedRoleLimit: (props: WouldExceedRoleLimit) => Promise<boolean>;
            }

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

            type Find<P extends string, F extends string> = {
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
                transaction: EntityManager;
                options?: FindOptions<RoleClosureEntity>;
                where?: FilterQuery<Entity>;
                descendant: string;
                depth?: number;
            };

            type FindAncestors = {
                populate: readonly EntityKey<Entity>[];
                descendant: string;
                pagination: Pagination;
                filters: Filters;
                realm: string;
            };

            type GetDescendants = {
                transaction: EntityManager;
                options?: FindOptions<RoleClosureEntity>;
                where?: FilterQuery<Entity>;
                ancestor: string;
                depth?: number;
            };

            type FindDescendants = {
                populate: readonly EntityKey<Entity>[];
                ancestor: string;
                pagination: Pagination;
                filters: Filters;
                realm: string;
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

            type FindAccountsByRoles = {
                transaction?: EntityManager;
                roles: string[];
            };

            type WouldExceedRoleLimit = {
                transaction?: EntityManager;
                count?: number;
                realm: string;
            };

            type Filters = {
                id?: StringFilterDTO;
                actorType?: StringFilterDTO;
                protoType?: StringFilterDTO;
                nonDelegable?: boolean;
                isSystemManaged?: boolean;
                code?: StringFilterDTO;
                name?: StringFilterDTO;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                isRevoked?: boolean;
                permission?: LinkFilterDTO;
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
