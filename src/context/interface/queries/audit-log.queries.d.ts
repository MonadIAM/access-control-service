declare namespace Queries {
    namespace AuditLog {
        type Entity = Repositories.AuditLog.Entity;

        interface Contract {
            findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
            findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
        }

        namespace FindUnique {
            type Props = {
                log: string;
            };

            type Result = Entity;
        }

        namespace FindMany {
            type Props = {
                filters: Adapters.AuditLog.Filters;
                sort: Adapters.AuditLog.Sort;
                pagination: Pagination;
            };

            type Result = [Entity[], number];
        }
    }
}
