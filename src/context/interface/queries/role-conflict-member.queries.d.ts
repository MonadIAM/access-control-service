import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleConflictMember {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findUnique: FindUnique.Signature;
                findMany: FindMany.Signature;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    member: string;
                    realm: string;
                    group: string;
                };

                type Result = Promise<Entities.RoleConflictMember>;

                type Signature = (props: Props) => Result;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.RoleConflictMember.Filters;
                    sort: Adapters.RoleConflictMember.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                    group: string;
                };

                type Result = Promise<[Entities.RoleConflictMember[], number]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
