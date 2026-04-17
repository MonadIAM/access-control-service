import { FindOptions } from "@mikro-orm/postgresql";

import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Permission {
            type Entity = Repositories.Permission.Entity;

            interface Contract {
                findEffective: (props: FindEffective.Props) => Promise<FindEffective.Result>;
                getLookupList: (props: GetLookupList.Props) => Promise<GetLookupList.Result>;
                findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
                findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
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

                type Result = [Entity[], number];
            }

            namespace GetLookupList {
                type Props = {
                    options?: FindOptions<Entity>;
                    pagination: Pagination;
                    realm: string;
                    term: string;
                };

                type Result = [Entity[], number];
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.Permission.Filters;
                    sort: Adapters.Permission.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = [Entity[], number];
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    permission: string;
                    realm: string;
                };

                type Result = Entity;
            }
        }
    }
}
