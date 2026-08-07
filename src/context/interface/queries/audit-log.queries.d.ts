import { QueryMode } from "~context/enums";

declare global {
    namespace Queries {
        namespace AuditLog {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                findUnique: FindUnique.Signature;
                findMany: FindMany.Signature;
            }

            namespace FindUnique {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    realm: string;
                    log: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    log: string;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<SystemEntities.AuditLog>;

                type Signature = (props: Props) => Result;
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Repositories.Mappers.AuditLog.Filters;
                    sort: Repositories.Mappers.AuditLog.Sort;
                    pagination: Pagination;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Repositories.Mappers.AuditLog.Filters;
                    sort: Repositories.Mappers.AuditLog.Sort;
                    pagination: Pagination;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[SystemEntities.AuditLog[], number]>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
