import { ResponseViewType, QueryMode } from "~context/enums";

declare global {
    namespace Queries {
        namespace PermissionOverride {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findUnique: FindUnique.Signature;
                findMany: FindMany.Signature;
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
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<Entities.PermissionOverride>;

                type Signature = (props: Props) => Result;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Repositories.Mappers.PermissionOverride.Filters;
                    sort: Repositories.Mappers.PermissionOverride.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                    actor: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Repositories.Mappers.PermissionOverride.Filters;
                    sort: Repositories.Mappers.PermissionOverride.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.PermissionOverride[], number]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
