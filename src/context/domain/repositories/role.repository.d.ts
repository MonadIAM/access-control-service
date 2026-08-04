import { DelegatorType } from "~context/enums";

declare global {
    namespace Repositories {
        namespace Role {
            type DepthEntity = Entities.Role & { depth: number };

            type Row = ORM.Raw<Entities.Role> & {
                realm_id: string;
            };

            type CountRow = {
                total: string;
            };

            type AccountRow = {
                account: string;
            };

            namespace Graph {
                type Node = {
                    id: string;
                    label: string;
                    attributes: {
                        code: string;
                        archetype: string;
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

            interface Contract extends PublicContract {}

            interface PublicContract extends Repositories.Base.Contract<
                Entities.Role,
                Adapters.RolePermissionAssignment.Types
            > {
                wouldExceedRoleLimit: WouldExceedRoleLimit.Signature;
                findAccountsByRoles: FindAccountsByRoles.Signature;
                getHierarchyGraph: GetHierarchyGraph.Signature;
                findDescendants: FindDescendants.Signature;
                getDescendants: GetDescendants.Signature;
                getLookupList: GetLookupList.Signature;
                findDelegable: FindDelegable.Signature;
                findEffective: FindEffective.Signature;
                findAncestors: FindAncestors.Signature;
                getAncestors: GetAncestors.Signature;
            }

            interface QueryContract extends Pick<
                PublicContract,
                | "findUniqueOrThrow"
                | "getHierarchyGraph"
                | "findDescendants"
                | "findDelegable"
                | "getLookupList"
                | "findEffective"
                | "findAncestors"
                | "findMany"
            > {}

            namespace WouldExceedRoleLimit {
                type Props = {
                    transaction?: ORM.EntityManager;
                    count?: number;
                    realm: string;
                };

                type Result = Promise<boolean>;

                type Signature = (props: Props) => Result;
            }

            namespace FindAccountsByRoles {
                type Props = {
                    transaction?: ORM.EntityManager;
                    roles: string[];
                };

                type Result = Promise<string[]>;

                type Signature = (props: Props) => Result;
            }

            namespace GetHierarchyGraph {
                type Props = {
                    transaction?: ORM.EntityManager;
                    realm: string;
                };

                type Result = Promise<Graph.Data>;

                type Signature = (props: Props) => Result;
            }

            namespace FindDescendants {
                type Props = {
                    populate: readonly ORM.EntityKey<Entities.Role>[];
                    filters: Adapters.Role.DefaultFilters;
                    pagination: Pagination;
                    ancestor: string;
                    realm: string;
                };

                type Result = Promise<[DepthEntity[], number]>;

                type Signature = (props: Props) => Result;
            }

            namespace GetDescendants {
                type Props = {
                    options?: ORM.FindOptions<Entities.RoleClosure>;
                    where?: ORM.FilterQuery<Entities.Role>;
                    transaction: ORM.EntityManager;
                    ancestor: string;
                    depth?: number;
                };

                type Result = Promise<Entities.Role[]>;

                type Signature = (props: Props) => Result;
            }

            namespace GetLookupList {
                type Props = {
                    pagination: Pagination;
                    realm?: string;
                    term: string;
                };

                type Result = Promise<[Entities.Role[], number]>;

                type Signature = (props: Props) => Result;
            }

            namespace FindDelegable {
                type Props = {
                    filters: Adapters.Role.Filters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    where: {
                        type: DelegatorType;
                        realm?: string;
                        id: string;
                    };
                };

                type Result = Promise<[Entities.Role[], number]>;

                type Signature = (props: Props) => Result;
            }

            namespace FindEffective {
                type Props = {
                    filters: Adapters.Role.Filters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    where: {
                        account: string;
                        realm?: string;
                    };
                };

                type Result = Promise<[Entities.Role[], number]>;

                type Signature = (props: Props) => Result;
            }

            namespace FindAncestors {
                type Props = {
                    populate: readonly ORM.EntityKey<Entities.Role>[];
                    filters: Adapters.Role.DefaultFilters;
                    pagination: Pagination;
                    descendant: string;
                    realm: string;
                };

                type Result = Promise<[DepthEntity[], number]>;

                type Signature = (props: Props) => Result;
            }

            namespace GetAncestors {
                type Props = {
                    options?: ORM.FindOptions<Entities.RoleClosure>;
                    where?: ORM.FilterQuery<Entities.Role>;
                    transaction: ORM.EntityManager;
                    descendant: string;
                    depth?: number;
                };

                type Result = Promise<Entities.Role[]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
