import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace AccountRoleAssignment {
            type Entity = Repositories.AccountRoleAssignment.Entity;

            interface Contract {
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
            }

            type FindMany = {
                filters: Repositories.AccountRoleAssignment.Filters;
                sort: Repositories.AccountRoleAssignment.Sort;
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
