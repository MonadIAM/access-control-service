import { QueryMode, ResponseViewType } from "~context/enums";

declare global {
    namespace Queries.Permission {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            findEffective: FindEffective.Signature;
            getLookupList: GetLookupList.Signature;
            findUnique: FindUnique.Signature;
            findMany: FindMany.Signature;
        }

        namespace FindEffective {
            type DefaultProps = {
                mode: QueryMode.DEFAULT;
                filters: Repositories.Mappers.Permission.DefaultFilters;
                sort: Repositories.Mappers.Permission.Sort;
                pagination: Pagination;
                realm: string;
                actor: string;
            };

            type ManageProps = {
                mode: QueryMode.MANAGE;
                filters: Repositories.Mappers.Permission.DefaultFilters;
                sort: Repositories.Mappers.Permission.Sort;
                pagination: Pagination;
                account: string;
                realm: string;
            };

            type Props = DefaultProps | ManageProps;

            type Result = Promise<[Entities.Permission[], number]>;

            type Signature = (props: Props) => Result;
        }

        namespace GetLookupList {
            type DefaultProps = {
                mode: QueryMode.DEFAULT;
                options?: ORM.FindOptions<Entities.Permission>;
                pagination: Pagination;
                realm: string;
                term: string;
            };

            type ManageProps = {
                mode: QueryMode.MANAGE;
                options?: ORM.FindOptions<Entities.Permission>;
                pagination: Pagination;
                term: string;
            };

            type Props = DefaultProps | ManageProps;

            type Result = Promise<[Entities.Permission[], number]>;

            type Signature = (props: Props) => Result;
        }

        namespace FindUnique {
            type Props = {
                view: ResponseViewType;
                permission: string;
                realm: string;
            };

            type Result = Promise<Entities.Permission>;

            type Signature = (props: Props) => Result;
        }

        namespace FindMany {
            type DefaultProps = {
                mode: QueryMode.DEFAULT;
                filters: Repositories.Mappers.Permission.DefaultFilters;
                sort: Repositories.Mappers.Permission.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                realm: string;
            };

            type ManageProps = {
                mode: QueryMode.MANAGE;
                filters: Repositories.Mappers.Permission.ManageFilters;
                sort: Repositories.Mappers.Permission.Sort;
                view: ResponseViewType;
                pagination: Pagination;
            };

            type Props = DefaultProps | ManageProps;

            type Result = Promise<[Entities.Permission[], number]>;

            type Signature = (props: Props) => Result;
        }
    }
}
