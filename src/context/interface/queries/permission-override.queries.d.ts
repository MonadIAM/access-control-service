import { ResponseViewType, QueryMode } from "~context/enums";

declare global {
    namespace Queries {
        namespace PermissionOverride {
            interface Contract {
                findUnique(props: FindUnique.DefaultProps): FindUnique.Result;
                findUnique(props: FindUnique.ManageProps): FindUnique.Result;
                findMany(props: FindMany.DefaultProps): FindMany.Result;
                findMany(props: FindMany.ManageProps): FindMany.Result;
            }

            namespace FindUnique {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    view: ResponseViewType;
                    override: string;
                    realm: string;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    view: ResponseViewType;
                    override: string;
                    realm: string;
                    account?: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<Entities.PermissionOverride>;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.PermissionOverride.Filters;
                    sort: Adapters.PermissionOverride.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.PermissionOverride.Filters;
                    sort: Adapters.PermissionOverride.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.PermissionOverride[], number]>;
            }
        }
    }
}
