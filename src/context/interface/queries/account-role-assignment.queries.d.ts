import { ResponseViewType, QueryMode } from "~context/enums";

declare global {
    namespace Queries {
        namespace AccountRoleAssignment {
            interface Contract {
                findUnique(props: FindUnique.Props): FindUnique.Result;
                findMany(props: FindMany.DefaultProps): FindMany.Result;
                findMany(props: FindMany.ManageProps): FindMany.Result;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    assignment: string;
                    realm: string;
                };

                type Result = Promise<Entities.AccountRoleAssignment>;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.AccountRoleAssignment.DefaultFilters;
                    sort: Adapters.AccountRoleAssignment.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.AccountRoleAssignment.ManageFilters;
                    sort: Adapters.AccountRoleAssignment.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.AccountRoleAssignment[], number]>;
            }
        }
    }
}
