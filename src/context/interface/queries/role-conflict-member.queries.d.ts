import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleConflictMember {
            type Entity = Repositories.RoleConflictMember.Entity;

            interface Contract {
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
            }

            type FindMany = {
                filters: Repositories.RoleConflictMember.Filters;
                sort: Repositories.RoleConflictMember.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                realm: string;
                group: string;
            };

            type FindUnique = {
                view: ResponseViewType;
                member: string;
                realm: string;
                group: string;
            };
        }
    }
}
