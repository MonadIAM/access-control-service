import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Realm {
            interface Contract {
                getLookupList(props: GetLookupList.DefaultProps): GetLookupList.Result;
                getLookupList(props: GetLookupList.ManageProps): GetLookupList.Result;
                findUnique(props: FindUnique.DefaultProps): FindUnique.Result;
                findUnique(props: FindUnique.ManageProps): FindUnique.Result;
                findMany(props: FindMany.DefaultProps): FindMany.Result;
                findMany(props: FindMany.ManageProps): FindMany.Result;
            }

            namespace GetLookupList {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    pagination: Pagination;
                    account: string;
                    term: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    pagination: Pagination;
                    term: string;
                };

                type Props = DefaultProps | ManageProps;
                type Result = Promise<[Entities.Realm[], number]>;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.Realm.Filters;
                    sort: Adapters.Realm.Sort;
                    pagination: Pagination;
                    view: ResponseViewType;
                    account: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.Realm.Filters;
                    sort: Adapters.Realm.Sort;
                    pagination: Pagination;
                    view: ResponseViewType;
                };

                type Props = DefaultProps | ManageProps;
                type Result = Promise<[Entities.Realm[], number]>;
            }

            namespace FindUnique {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    view: ResponseViewType;
                    account: string;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    view: ResponseViewType;
                    realm: string;
                };

                type Props = DefaultProps | ManageProps;
                type Result = Promise<Entities.Realm>;
            }
        }
    }
}
