import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Role {
            type DepthEntity = Entities.Role & { depth: number };

            type Graph = Repositories.Role.Graph.Data;

            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findDelegableByAccount: FindDelegableByAccount.Signature;
                findDelegableByRole: FindDelegableByRole.Signature;
                getHierarchyGraph: GetHierarchyGraph.Signature;
                findDescendants: FindDescendants.Signature;
                findAncestors: FindAncestors.Signature;
                getLookupList: GetLookupList.Signature;
                findEffective: FindEffective.Signature;
                findUnique: FindUnique.Signature;
                findMany: FindMany.Signature;
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

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
            }

            namespace GetHierarchyGraph {
                type Props = {
                    realm: string;
                };

                type Result = Promise<Graph>;

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
            }

            namespace GetLookupList {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    options?: ORM.FindOptions<Entities.Role>;
                    pagination: Pagination;
                    realm: string;
                    term: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    options?: ORM.FindOptions<Entities.Role>;
                    pagination: Pagination;
                    term: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.Role[], number]>;

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    realm: string;
                    role: string;
                };

                type Result = Promise<Entities.Role>;

                type Signature = (props: Props) => Result;
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

                type Signature = (props: Props) => Result;
            }
        }
    }
}
