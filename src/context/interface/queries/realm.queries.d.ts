import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Realm {
            type Entity = Repositories.Realm.Entity;

            interface Contract {
                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
            }

            type GetLookupList = {
                permissions?: string[];
                pagination: Pagination;
                account: string;
                term: string;
            };

            type FindMany = {
                permissions?: string[];
                filters: Repositories.Realm.Filters;
                sort: Repositories.Realm.Sort;
                pagination: Pagination;
                view: ResponseViewType;
                account: string;
            };

            type FindUnique = {
                view: ResponseViewType;
                permissions?: string[];
                account: string;
                realm: string;
            };
        }
    }
}
