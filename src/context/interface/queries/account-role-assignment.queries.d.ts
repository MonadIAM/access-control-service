import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace AccountRoleAssignment {
            type Entity = Repositories.AccountRoleAssignment.Entity;

            interface Contract {
                findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
                findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    assignment: string;
                    realm: string;
                };

                type Result = Entity;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.AccountRoleAssignment.Filters;
                    sort: Adapters.AccountRoleAssignment.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = [Entity[], number];
            }
        }
    }
}
