import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries.RolePermissionAssignment {
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

            type Result = Promise<Entities.RolePermissionAssignment>;

            type Signature = (props: Props) => Result;
        }

        namespace FindMany {
            type Props = {
                filters: Repositories.Mappers.RolePermissionAssignment.Filters;
                sort: Repositories.Mappers.RolePermissionAssignment.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                realm: string;
            };

            type Result = Promise<[Entities.RolePermissionAssignment[], number]>;

            type Signature = (props: Props) => Result;
        }
    }
}
