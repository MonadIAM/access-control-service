import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Realm {
            interface Contract {
                getLookupList: (props: GetLookupList.Props) => GetLookupList.Result;
                findUnique: (props: FindUnique.Props) => FindUnique.Result;
                findMany: (props: FindMany.Props) => FindMany.Result;
            }

            namespace GetLookupList {
                type Props = {
                    permissions?: string[];
                    pagination: Pagination;
                    account: string;
                    term: string;
                };

                type Result = Promise<[Entities.Realm[], number]>;
            }

            namespace FindMany {
                type Props = {
                    permissions?: string[];
                    filters: Adapters.Realm.Filters;
                    sort: Adapters.Realm.Sort;
                    pagination: Pagination;
                    view: ResponseViewType;
                    account: string;
                };

                type Result = Promise<[Entities.Realm[], number]>;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    permissions?: string[];
                    account: string;
                    realm: string;
                };

                type Result = Promise<Entities.Realm>;
            }
        }
    }
}
