import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace PermissionOverride {
            type Entity = Repositories.PermissionOverride.Entity;

            interface Contract {
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
            }

            type FindMany = {
                permissions?: string[];
                filters: Repositories.PermissionOverride.Filters;
                sort: Repositories.PermissionOverride.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                realm: string;
                actor: string;
            };

            type FindUnique = {
                permissions?: string[];
                view: ResponseViewType;
                override: string;
                account?: string;
                realm: string;
                actor: string;
            };
        }
    }
}
