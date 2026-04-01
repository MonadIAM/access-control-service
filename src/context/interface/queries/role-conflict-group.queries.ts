import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleConflictGroup {
            type Entity = Repositories.RoleConflictGroup.Entity;

            interface Contract {
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
                findViolationDetails: (props: FindViolationDetails) => Promise<Entity[]>;
            }

            type FindMany = {
                filters: Repositories.RoleConflictGroup.Filters;
                sort: Repositories.RoleConflictGroup.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                realm: string;
            };

            type FindUnique = {
                view: ResponseViewType;
                group: string;
                realm: string;
            };

            type FindViolationDetails = {
                account: string;
                roles: string[];
                realm: string;
            };
        }
    }
}
