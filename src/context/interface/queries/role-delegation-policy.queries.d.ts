import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleDelegationPolicy {
            type Entity = Repositories.RoleDelegationPolicy.Entity;

            interface Contract {
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
            }

            type FindMany = {
                filters: Repositories.RoleDelegationPolicy.Filters;
                sort: Repositories.RoleDelegationPolicy.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                realm: string;
            };

            type FindUnique = {
                view: ResponseViewType;
                policy: string;
                realm: string;
            };
        }
    }
}
