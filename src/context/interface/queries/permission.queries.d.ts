import { FindOptions } from "@mikro-orm/postgresql";

import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Permission {
            interface Contract {
                findEffective(props: FindEffective.DefaultProps): FindEffective.Result;
                findEffective(props: FindEffective.ManageProps): FindEffective.Result;
                getLookupList(props: GetLookupList.Props): GetLookupList.Result;
                findUnique(props: FindUnique.Props): FindUnique.Result;
                findMany(props: FindMany.DefaultProps): FindMany.Result;
                findMany(props: FindMany.ManageProps): FindMany.Result;
            }

            namespace FindEffective {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.Permission.DefaultFilters;
                    sort: Adapters.Permission.Sort;
                    pagination: Pagination;
                    realm: string;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.Permission.DefaultFilters;
                    sort: Adapters.Permission.Sort;
                    pagination: Pagination;
                    realm: string;
                    account: string;
                };

                type Props = DefaultProps | ManageProps;
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
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.Permission.DefaultFilters;
                    sort: Adapters.Permission.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.Permission.ManageFilters;
                    sort: Adapters.Permission.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                };

                type Props = DefaultProps | ManageProps;
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
