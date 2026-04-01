import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RolePermissionAssignment {
            type Entity = Repositories.RolePermissionAssignment.Entity;

            interface Contract {
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
            }

            type FindMany = {
                filters: Repositories.RolePermissionAssignment.Filters;
                sort: Repositories.RolePermissionAssignment.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                realm: string;
            };

            type FindUnique = {
                view: ResponseViewType;
                assignment: string;
                realm: string;
            };
        }
    }
}
