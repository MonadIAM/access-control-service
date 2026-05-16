import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace AccountRoleAssignment {
            interface Contract {
                findUnique: (props: FindUnique.Props) => FindUnique.Result;
                findMany: (props: FindMany.Props) => FindMany.Result;
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
                type Props = {
                    filters: Adapters.AccountRoleAssignment.Filters;
                    sort: Adapters.AccountRoleAssignment.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = Promise<[Entities.AccountRoleAssignment[], number]>;
            }
        }
    }
}
