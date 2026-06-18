import { FindOptions } from "@mikro-orm/postgresql";

import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Role {
            type DepthEntity = Entities.Role & { depth: number };
            type Graph = Repositories.Role.Graph.Data;

            interface Contract {
                findDelegableByAccount(props: FindDelegableByAccount.DefaultProps): FindDelegableByAccount.Result;
                findDelegableByAccount(props: FindDelegableByAccount.ManageProps): FindDelegableByAccount.Result;
                findDelegableByRole(props: FindDelegableByRole.Props): FindDelegableByRole.Result;
                getHierarchyGraph(props: GetHierarchyGraph.Props): GetHierarchyGraph.Result;
                getLookupList(props: GetLookupList.DefaultProps): GetLookupList.Result;
                getLookupList(props: GetLookupList.ManageProps): GetLookupList.Result;
                findEffective(props: FindEffective.DefaultProps): FindEffective.Result;
                findEffective(props: FindEffective.ManageProps): FindEffective.Result;
                findDescendants(props: FindDescendants.Props): FindDescendants.Result;
                findAncestors(props: FindAncestors.Props): FindAncestors.Result;
                findMany(props: FindMany.DefaultProps): FindMany.Result;
                findMany(props: FindMany.ManageProps): FindMany.Result;
                findUnique(props: FindUnique.Props): FindUnique.Result;
            }

            namespace FindDelegableByAccount {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.Role.DefaultFilters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    realm: string;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.Role.ManageFilters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    account: string;
                };

                type Props = DefaultProps | ManageProps;
                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace FindDelegableByRole {
                type Props = {
                    filters: Adapters.Role.DefaultFilters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    realm: string;
                    id: string;
                };

                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace FindDescendants {
                type Props = {
                    filters: Adapters.Role.DefaultFilters;
                    view: ResponseViewType;
                    pagination: Pagination;
                    ancestor: string;
                    realm: string;
                };

                type Result = Promise<[DepthEntity[], number]>;
            }

            namespace FindAncestors {
                type Props = {
                    filters: Adapters.Role.DefaultFilters;
                    view: ResponseViewType;
                    pagination: Pagination;
                    descendant: string;
                    realm: string;
                };

                type Result = Promise<[DepthEntity[], number]>;
            }

            namespace FindEffective {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.Role.DefaultFilters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    realm: string;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.Role.ManageFilters;
                    sort: Adapters.Role.Sort;
                    pagination: Pagination;
                    account: string;
                };

                type Props = DefaultProps | ManageProps;
                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace GetLookupList {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    options?: FindOptions<Entities.Role>;
                    pagination: Pagination;
                    realm: string;
                    term: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    options?: FindOptions<Entities.Role>;
                    pagination: Pagination;
                    term: string;
                };

                type Props = DefaultProps | ManageProps;
                type Result = Promise<[Entities.Role[], number]>;
            }

            namespace GetHierarchyGraph {
                type Props = {
                    realm: string;
                };

                type Result = Promise<Graph>;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.Role.DefaultFilters;
                    sort: Adapters.Role.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.Role.ManageFilters;
                    sort: Adapters.Role.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                };

                type Props = DefaultProps | ManageProps;
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
