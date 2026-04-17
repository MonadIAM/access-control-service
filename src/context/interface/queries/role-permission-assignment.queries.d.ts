import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RolePermissionAssignment {
            type Entity = Repositories.RolePermissionAssignment.Entity;

            interface Contract {
                findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
                findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.RolePermissionAssignment.Filters;
                    sort: Adapters.RolePermissionAssignment.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = [Entity[], number];
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    assignment: string;
                    realm: string;
                };

                type Result = Entity;
            }
        }
    }
}
