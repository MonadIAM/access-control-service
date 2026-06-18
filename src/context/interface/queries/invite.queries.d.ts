import { InviteQueryScope, QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Invite {
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
                    invite: string;
                    realm: string;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    view: ResponseViewType;
                    invite: string;
                    realm: string;
                };

                type Props = DefaultProps | ManageProps;
                type Result = Promise<Entities.Invite>;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.Invite.DefaultFilters;
                    sort: Adapters.Invite.Sort;
                    scope: InviteQueryScope;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.Invite.ManageFilters;
                    sort: Adapters.Invite.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                };

                type Props = DefaultProps | ManageProps;
                type Result = Promise<[Entities.Invite[], number]>;
            }
        }
    }
}
