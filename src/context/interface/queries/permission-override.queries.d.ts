import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace PermissionOverride {
            type Entity = Repositories.PermissionOverride.Entity;

            interface Contract {
                findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
                findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
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

                type Result = Entity;
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

                type Result = [Entity[], number];
            }
        }
    }
}
