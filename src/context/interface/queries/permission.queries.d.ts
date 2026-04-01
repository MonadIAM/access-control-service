import { FindOptions } from "@mikro-orm/postgresql";

import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Permission {
            type Entity = Repositories.Permission.Entity;

            interface Contract {
                findEffective: (props: FindEffective) => Promise<[Entity[], number]>;
                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
            }

            type FindEffective = {
                permissions?: string[];
                filters: Repositories.Permission.Filters;
                sort: Repositories.Permission.Sort;
                pagination: Pagination;
                account?: string;
                realm: string;
                actor: string;
            };

            type GetLookupList = {
                options?: FindOptions<Entity>;
                pagination: Pagination;
                realm: string;
                term: string;
            };

            type FindMany = {
                filters: Repositories.Permission.Filters;
                sort: Repositories.Permission.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                realm: string;
            };

            type FindUnique = {
                view: ResponseViewType;
                permission: string;
                realm: string;
            };
        }
    }
}
