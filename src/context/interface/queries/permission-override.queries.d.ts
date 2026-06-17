import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace PermissionOverride {
            interface Contract {
                findUnique(props: FindUnique.Props): FindUnique.Result;
                findMany(props: FindMany.Props): FindMany.Result;
            }

            namespace FindUnique {
                type Props = {
                    permissions?: string[];
                    view: ResponseViewType;
                    override: string;
                    account?: string;
                    realm: string;
                    actor: string;
                };

                type Result = Promise<Entities.PermissionOverride>;
            }

            namespace FindMany {
                type Props = {
                    permissions?: string[];
                    filters: Adapters.PermissionOverride.Filters;
                    sort: Adapters.PermissionOverride.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                    actor: string;
                };

                type Result = Promise<[Entities.PermissionOverride[], number]>;
            }
        }
    }
}
