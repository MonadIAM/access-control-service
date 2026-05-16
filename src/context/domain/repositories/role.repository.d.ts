import { EntityManager, FilterQuery, FindOptions, EntityKey } from "@mikro-orm/postgresql";

import { DelegatorType } from "~context/enums";

declare global {
    namespace Repositories {
        namespace Role {
            type DepthEntity = Entities.Role & { depth: number };

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

            interface Contract extends Repositories.Base.Contract<Entities.Role, Adapters.RolePermissionAssignment.Types> {
                wouldExceedRoleLimit: (props: WouldExceedRoleLimit.Props) => WouldExceedRoleLimit.Result;
                findAccountsByRoles: (props: FindAccountsByRoles.Props) => FindAccountsByRoles.Result;
                getHierarchyGraph: (props: GetHierarchyGraph.Props) => GetHierarchyGraph.Result;
                findDelegateable: (props: FindDelegateable.Props) => FindDelegateable.Result;
                findDescendants: (props: FindDescendants.Props) => FindDescendants.Result;
                getDescendants: (props: GetDescendants.Props) => GetDescendants.Result;
                getLookupList: (props: GetLookupList.Props) => GetLookupList.Result;
                findEffective: (props: FindEffective.Props) => FindEffective.Result;
                findAncestors: (props: FindAncestors.Props) => FindAncestors.Result;
                getAncestors: (props: GetAncestors.Props) => GetAncestors.Result;
            }

            interface QueryContract
                extends Pick<
                    Contract,
                    | "findMany"
                    | "getLookupList"
                    | "findEffective"
                    | "findAncestors"
                    | "findDescendants"
                    | "findDelegateable"
                    | "findUniqueOrThrow"
                    | "getHierarchyGraph"
                > {}

            namespace FindAccountsByRoles {
                type Props = {
                    transaction?: EntityManager;
                    roles: string[];
                };

                type Result = Promise<string[]>;
            }

            namespace GetLookupList {
                type Props = {
                    pagination: Pagination;
                    realm: string;
                    term: string;
                };

                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace GetAncestors {
                type Props = {
                    options?: FindOptions<Entities.RoleClosure>;
                    where?: FilterQuery<Entities.Role>;
                    transaction: EntityManager;
                    descendant: string;
                    depth?: number;
                };

                type Result = Promise<Entities.Role[]>;
            }

            namespace FindAncestors {
                type Props = {
                    populate: readonly EntityKey<Entities.Role>[];
                    filters: Adapters.Role.Filters;
                    pagination: Pagination;
                    descendant: string;
                    realm: string;
                };

                type Result = Promise<[DepthEntity[], number]>;
            }

            namespace GetDescendants {
                type Props = {
                    options?: FindOptions<Entities.RoleClosure>;
                    where?: FilterQuery<Entities.Role>;
                    transaction: EntityManager;
                    ancestor: string;
                    depth?: number;
                };

                type Result = Promise<Entities.Role[]>;
            }

            namespace FindDescendants {
                type Props = {
                    populate: readonly EntityKey<Entities.Role>[];
                    filters: Adapters.Role.Filters;
                    pagination: Pagination;
                    ancestor: string;
                    realm: string;
                };

                type Result = Promise<[DepthEntity[], number]>;
            }

            namespace FindDelegateable {
                type Props = {
                    filters: Adapters.Role.Filters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    where: {
                        type: DelegatorType;
                        realm: string;
                        id: string;
                    };
                };

                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace FindEffective {
                type Props = {
                    filters: Adapters.Role.Filters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    where: {
                        account: string;
                        realm: string;
                    };
                };

                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace GetHierarchyGraph {
                type Props = {
                    transaction?: EntityManager;
                    realm: string;
                };

                type Result = Promise<Graph.Data>;
            }

            namespace WouldExceedRoleLimit {
                type Props = {
                    transaction?: EntityManager;
                    count?: number;
                    realm: string;
                };

                type Result = Promise<boolean>;
            }
        }
    }
}
