import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleConflictMember {
            interface Contract {
                findUnique(props: FindUnique.Props): FindUnique.Result;
                findMany(props: FindMany.Props): FindMany.Result;
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
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    member: string;
                    realm: string;
                    group: string;
                };

                type Result = Promise<Entities.RoleConflictMember>;
            }
        }
    }
}
