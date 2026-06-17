import { FindOptions } from "@mikro-orm/postgresql";

import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Role {
            type DepthEntity = Entities.Role & { depth: number };
            type Graph = Repositories.Role.Graph.Data;

            interface Contract {
                findDelegableByAccount(props: FindDelegableByAccount.Props): FindDelegableByAccount.Result;
                findDelegableByRole(props: FindDelegableByRole.Props): FindDelegableByRole.Result;
                getHierarchyGraph(props: GetHierarchyGraph.Props): GetHierarchyGraph.Result;
                findDescendants(props: FindDescendants.Props): FindDescendants.Result;
                findAncestors(props: FindAncestors.Props): FindAncestors.Result;
                findEffective(props: FindEffective.Props): FindEffective.Result;
                getLookupList(props: GetLookupList.Props): GetLookupList.Result;
                findUnique(props: FindUnique.Props): FindUnique.Result;
                findMany(props: FindMany.Props): FindMany.Result;
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

                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace FindDelegableByRole {
                type Props = {
                    filters: Adapters.Role.Filters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    realm: string;
                    id: string;
                };

                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace FindDescendants {
                type Props = {
                    filters: Adapters.Role.Filters;
                    view: ResponseViewType;
                    pagination: Pagination;
                    ancestor: string;
                    realm: string;
                };

                type Result = Promise<[DepthEntity[], number]>;
            }

            namespace FindAncestors {
                type Props = {
                    filters: Adapters.Role.Filters;
                    view: ResponseViewType;
                    pagination: Pagination;
                    descendant: string;
                    realm: string;
                };

                type Result = Promise<[DepthEntity[], number]>;
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

                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace GetLookupList {
                type Props = {
                    options?: FindOptions<Entities.Role>;
                    pagination: Pagination;
                    realm: string;
                    term: string;
                };

                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace GetHierarchyGraph {
                type Props = {
                    realm: string;
                };

                type Result = Promise<Graph>;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.Role.Filters;
                    sort: Adapters.Role.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    realm: string;
                    role: string;
                };

                type Result = Promise<Entities.Role>;
            }
        }
    }
}
