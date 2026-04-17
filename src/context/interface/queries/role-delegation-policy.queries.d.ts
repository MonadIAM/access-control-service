import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleDelegationPolicy {
            type Entity = Repositories.RoleDelegationPolicy.Entity;

            interface Contract {
                findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
                findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.RoleDelegationPolicy.Filters;
                    sort: Adapters.RoleDelegationPolicy.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = [Entity[], number];
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    policy: string;
                    realm: string;
                };

                type Result = Entity;
            }
        }
    }
}
