import { FindOptions } from "@mikro-orm/postgresql";

import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Role {
            type Entity = Repositories.Role.Entity;
            type DepthEntity = Entity & { depth: number };
            type Graph = Repositories.Role.Graph.Data;

            interface Contract {
                findDelegableByAccount: (props: FindDelegableByAccount.Props) => Promise<FindDelegableByAccount.Result>;
                findDelegableByRole: (props: FindDelegableByRole.Props) => Promise<FindDelegableByRole.Result>;
                getHierarchyGraph: (props: GetHierarchyGraph.Props) => Promise<GetHierarchyGraph.Result>;
                findDescendants: (props: FindDescendants.Props) => Promise<FindDescendants.Result>;
                findAncestors: (props: FindAncestors.Props) => Promise<FindAncestors.Result>;
                findEffective: (props: FindEffective.Props) => Promise<FindEffective.Result>;
                getLookupList: (props: GetLookupList.Props) => Promise<GetLookupList.Result>;
                findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
                findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
            }

            namespace FindDelegableByAccount {
                type Props = {
                    permissions?: string[];
                    filters: Adapters.Role.Filters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    realm: string;
                    actor: string;
                    id?: string;
                };

                type Result = [Entity[], number];
            }

            namespace FindDelegableByRole {
                type Props = {
                    filters: Adapters.Role.Filters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    realm: string;
                    id: string;
                };

                type Result = [Entity[], number];
            }

            namespace FindDescendants {
                type Props = {
                    filters: Adapters.Role.Filters;
                    view: ResponseViewType;
                    pagination: Pagination;
                    ancestor: string;
                    realm: string;
                };

                type Result = [DepthEntity[], number];
            }

            namespace FindAncestors {
                type Props = {
                    filters: Adapters.Role.Filters;
                    view: ResponseViewType;
                    pagination: Pagination;
                    descendant: string;
                    realm: string;
                };

                type Result = [DepthEntity[], number];
            }

            namespace FindEffective {
                type Props = {
                    permissions?: string[];
                    filters: Adapters.Role.Filters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    account?: string;
                    realm: string;
                    actor: string;
                };

                type Result = [Entity[], number];
            }

            namespace GetLookupList {
                type Props = {
                    options?: FindOptions<Entity>;
                    pagination: Pagination;
                    realm: string;
                    term: string;
                };

                type Result = [Entity[], number];
            }

            namespace GetHierarchyGraph {
                type Props = {
                    realm: string;
                };

                type Result = Graph;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.Role.Filters;
                    sort: Adapters.Role.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = [Entity[], number];
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    realm: string;
                    role: string;
                };

                type Result = Entity;
            }
        }
    }
}
