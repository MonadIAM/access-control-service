import { FindOptions } from "@mikro-orm/postgresql";

import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Permission {
            interface Contract {
                findEffective: (props: FindEffective.Props) => FindEffective.Result;
                getLookupList: (props: GetLookupList.Props) => GetLookupList.Result;
                findUnique: (props: FindUnique.Props) => FindUnique.Result;
                findMany: (props: FindMany.Props) => FindMany.Result;
            }

            namespace FindEffective {
                type Props = {
                    permissions?: string[];
                    filters: Adapters.Permission.Filters;
                    sort: Adapters.Permission.Sort;
                    pagination: Pagination;
                    account?: string;
                    realm: string;
                    actor: string;
                };

                type Result = Promise<[Entities.Permission[], number]>;
            }

            namespace GetLookupList {
                type Props = {
                    options?: FindOptions<Entities.Permission>;
                    pagination: Pagination;
                    realm: string;
                    term: string;
                };

                type Result = Promise<[Entities.Permission[], number]>;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.Permission.Filters;
                    sort: Adapters.Permission.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = Promise<[Entities.Permission[], number]>;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    permission: string;
                    realm: string;
                };

                type Result = Promise<Entities.Permission>;
            }
        }
    }
}
