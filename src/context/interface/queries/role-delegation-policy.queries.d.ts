import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleDelegationPolicy {
            interface Contract {
                findUnique: (props: FindUnique.Props) => FindUnique.Result;
                findMany: (props: FindMany.Props) => FindMany.Result;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.RoleDelegationPolicy.Filters;
                    sort: Adapters.RoleDelegationPolicy.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = Promise<[Entities.RoleDelegationPolicy[], number]>;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    policy: string;
                    realm: string;
                };

                type Result = Promise<Entities.RoleDelegationPolicy>;
            }
        }
    }
}
