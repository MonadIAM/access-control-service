import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleConflictMember {
            type Entity = Repositories.RoleConflictMember.Entity;

            interface Contract {
                findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
                findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
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

                type Result = [Entity[], number];
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    member: string;
                    realm: string;
                    group: string;
                };

                type Result = Entity;
            }
        }
    }
}
