import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RolePermissionAssignment {
            interface Contract {
                findUnique(props: FindUnique.Props): FindUnique.Result;
                findMany(props: FindMany.Props): FindMany.Result;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.RolePermissionAssignment.Filters;
                    sort: Adapters.RolePermissionAssignment.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = Promise<[Entities.RolePermissionAssignment[], number]>;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    assignment: string;
                    realm: string;
                };

                type Result = Promise<Entities.RolePermissionAssignment>;
            }
        }
    }
}
