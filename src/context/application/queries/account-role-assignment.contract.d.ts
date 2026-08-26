import { ResponseViewType, QueryMode } from "~context/enums";

declare global {
    namespace Queries {
        namespace AccountRoleAssignment {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findUnique: FindUnique.Signature;
                findMany: FindMany.Signature;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    assignment: string;
                    realm: string;
                };

                type Result = Promise<Entities.AccountRoleAssignment>;

                type Signature = (props: Props) => Result;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Repositories.Mappers.AccountRoleAssignment.DefaultFilters;
                    sort: Repositories.Mappers.AccountRoleAssignment.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Repositories.Mappers.AccountRoleAssignment.ManageFilters;
                    sort: Repositories.Mappers.AccountRoleAssignment.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[Entities.AccountRoleAssignment[], number]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
