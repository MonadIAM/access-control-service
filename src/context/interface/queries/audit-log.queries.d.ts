import { QueryMode } from "~context/enums";

declare global {
    namespace Queries {
        namespace AuditLog {
            interface Contract {
                findUnique(props: FindUnique.DefaultProps): FindUnique.Result;
                findUnique(props: FindUnique.ManageProps): FindUnique.Result;
                findMany(props: FindMany.DefaultProps): FindMany.Result;
                findMany(props: FindMany.ManageProps): FindMany.Result;
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
            }

            namespace FindMany {
                type DefaultProps = {
                    mode: QueryMode.DEFAULT;
                    filters: Adapters.AuditLog.Filters;
                    sort: Adapters.AuditLog.Sort;
                    pagination: Pagination;
                    realm: string;
                };

                type ManageProps = {
                    mode: QueryMode.MANAGE;
                    filters: Adapters.AuditLog.Filters;
                    sort: Adapters.AuditLog.Sort;
                    pagination: Pagination;
                };

                type Props = DefaultProps | ManageProps;

                type Result = Promise<[SystemEntities.AuditLog[], number]>;
            }
        }
    }
}
