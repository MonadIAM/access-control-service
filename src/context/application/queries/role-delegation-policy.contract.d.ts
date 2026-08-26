import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleDelegationPolicy {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findUnique: FindUnique.Signature;
                findMany: FindMany.Signature;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    policy: string;
                    realm: string;
                };

                type Result = Promise<Entities.RoleDelegationPolicy>;

                type Signature = (props: Props) => Result;
            }

            namespace FindMany {
                type Props = {
                    filters: Repositories.Mappers.RoleDelegationPolicy.Filters;
                    sort: Repositories.Mappers.RoleDelegationPolicy.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = Promise<[Entities.RoleDelegationPolicy[], number]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
