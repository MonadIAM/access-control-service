import { InviteQueryScope, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Invite {
            interface Contract {
                findUnique(props: FindUnique.Props): FindUnique.Result;
                findMany(props: FindMany.Props): FindMany.Result;
            }

            namespace FindUnique {
                type Props = {
                    permissions: string[];
                    view: ResponseViewType;
                    invite: string;
                    realm: string;
                    actor: string;
                };

                type Result = Promise<Entities.Invite>;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.Invite.Filters;
                    sort: Adapters.Invite.Sort;
                    scope?: InviteQueryScope;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm?: string;
                    actor: string;
                };

                type Result = Promise<[Entities.Invite[], number]>;
            }
        }
    }
}
