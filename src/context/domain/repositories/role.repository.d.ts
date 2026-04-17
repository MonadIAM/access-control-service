import { EntityManager, FilterQuery, FindOptions, EntityKey } from "@mikro-orm/postgresql";

import { DelegatorType } from "~context/enums";

import { RoleClosure as RoleClosureEntity, Role as RoleEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Role {
            type Entity = RoleEntity;
            type DepthEntity = Entity & { depth: number };

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

            interface InternalContract extends Repositories.Base.Contract<Entity, Adapters.RolePermissionAssignment.Types> {
                findDescendants: (props: FindDescendants) => Promise<[DepthEntity[], number]>;
                findDelegateable: (props: FindDelegateable) => Promise<[Entity[], number]>;
                findAncestors: (props: FindAncestors) => Promise<[DepthEntity[], number]>;
                wouldExceedRoleLimit: (props: WouldExceedRoleLimit) => Promise<boolean>;
                findAccountsByRoles: (props: FindAccountsByRoles) => Promise<string[]>;
                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;
                findEffective: (props: FindEffective) => Promise<[Entity[], number]>;
                getHierarchyGraph: (props: GetHierarchyGraph) => Promise<Graph.Data>;
                getDescendants: (props: GetDescendants) => Promise<Entity[]>;
                getAncestors: (props: GetAncestors) => Promise<Entity[]>;
            }

            interface ExternalContract
                extends Pick<
                    InternalContract,
                    | "findMany"
                    | "getLookupList"
                    | "findEffective"
                    | "findAncestors"
                    | "findDescendants"
                    | "findDelegateable"
                    | "findUniqueOrThrow"
                    | "getHierarchyGraph"
                > {}

            type GetAncestors = {
                options?: FindOptions<RoleClosureEntity>;
                where?: FilterQuery<Entity>;
                transaction: EntityManager;
                descendant: string;
                depth?: number;
            };

            type FindAncestors = {
                populate: readonly EntityKey<Entity>[];
                filters: Adapters.Role.Filters;
                pagination: Pagination;
                descendant: string;
                realm: string;
            };

            type GetDescendants = {
                options?: FindOptions<RoleClosureEntity>;
                where?: FilterQuery<Entity>;
                transaction: EntityManager;
                ancestor: string;
                depth?: number;
            };

            type FindDescendants = {
                populate: readonly EntityKey<Entity>[];
                filters: Adapters.Role.Filters;
                pagination: Pagination;
                ancestor: string;
                realm: string;
            };

            type GetLookupList = {
                pagination: Pagination;
                realm: string;
                term: string;
            };

            type FindDelegateable = {
                filters: Adapters.Role.Filters;
                sort: Adapters.Role.Sort;
                pagination: Pagination;
                where: {
                    type: DelegatorType;
                    realm: string;
                    id: string;
                };
            };

            type FindEffective = {
                filters: Adapters.Role.Filters;
                sort: Adapters.Role.Sort;
                pagination: Pagination;
                where: {
                    account: string;
                    realm: string;
                };
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
        }
    }
}
